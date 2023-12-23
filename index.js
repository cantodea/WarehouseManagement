const express = require('express');
const cors = require('cors');

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 引入用户路由
const userRoutes = require('./userRoutes');
const app = express();
app.use(cors());
app.use(express.json());

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

let database, localWarehouse, amazonWarehouse, amazonLog, localLog, usersCollection,suppliersCollection,ordersCollection;


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log("Authorization Header:", authHeader); // 添加这行来检查授权头

    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, 'yourSecretKey', (err, user) => {
        if (err) return res.sendStatus(403);

        console.log("解析的用户信息: ", user); // 检查解析后的用户信息
        req.user = user;
        console.log("赋值给 req.user 后: ", req.user); // 检查赋值后的结果
        next();
    });
};

(async function initialize() {
    try {
        await client.connect();
        database = client.db("warehouseManagement");
        localWarehouse = database.collection("localWarehouse");
        amazonWarehouse = database.collection("amazonWarehouse");
        amazonLog = database.collection("amazonLog");
        localLog = database.collection("localLog");
        usersCollection = database.collection("users"); // 添加这行来初始化用户集合
        suppliersCollection = database.collection("Suppliers"); // 初始化供应商集合
        ordersCollection = database.collection("Orders");


        // 使用用户路由，并传递 usersCollection
        app.use('/api', require('./userRoutes')(usersCollection));
    } catch (err) {
        console.error("Error connecting to MongoDB", err);
        process.exit(1);
    }
})();



// API 端点：获取所有本地仓库项目
app.get('/api/local-items', async (req, res) => {
    try {
        const items = await localWarehouse.find({}).toArray();
        res.json(items);
    } catch (err) {
        console.error("Error fetching local items", err);
        res.status(500).send("Error fetching local items");
    }
});

// API 端点：添加新项目到本地仓库，并记录日志
app.post('/api/local-items', authenticateToken,async (req, res) => {
    try {
        const newItem = req.body;
        const result = await localWarehouse.insertOne(newItem);

        // 获取当前操作用户
        const operatedBy = req.user.username;

        // 添加操作日志
        const logEntry = {
            itemId: result.insertedId, // 使用插入的新项目 ID
            action: 'Item Added',
            details: newItem, // 或者只记录关键信息
            operatedBy,
            timestamp: new Date()
        };
        await localLog.insertOne(logEntry);

        res.status(201).send("New local item added and logged");
    } catch (err) {
        console.error("Error inserting local item", err);
        res.status(500).send("Error inserting local item");
    }
});
// API 端点：调整本地仓库中的产品库存
app.post('/api/local-items/adjust-stock', authenticateToken, async (req, res) => {
    try {
        const { itemId, actualStock, availableQuantity, onOrderQuantity, revokedStock, defectiveStock } = req.body;
        let objectId;
        try {
            objectId = new ObjectId(itemId);
        } catch (err) {
            return res.status(400).send("Invalid itemId format");
        }

        const currentItem = await localWarehouse.findOne({ _id: objectId });
        if (!currentItem) {
            return res.status(404).send("Item not found");
        }

        const updateResult = await localWarehouse.updateOne(
            { _id: objectId },
            { $set: { actualStock, availableQuantity, onOrderQuantity, revokedStock, defectiveStock }}
        );

        if (!updateResult.matchedCount) {
            return res.status(404).send("Item not found");
        }

        const operatedBy = req.user.username; // 获取当前操作用户

        const logEntry = {
            itemId: objectId,
            action: 'Stock Adjusted',
            details: {
                before: {
                    actualStock: currentItem.actualStock,
                    availableQuantity: currentItem.availableQuantity,
                    onOrderQuantity: currentItem.onOrderQuantity,
                    revokedStock: currentItem.revokedStock,
                    defectiveStock: currentItem.defectiveStock
                },
                after: {
                    actualStock, 
                    availableQuantity, 
                    onOrderQuantity, 
                    revokedStock, 
                    defectiveStock
                }
            },
            operatedBy, // 添加操作人信息
            timestamp: new Date()
        };
        await localLog.insertOne(logEntry);

        res.status(200).send("Stock adjusted and logged");
    } catch (err) {
        console.error("Error adjusting stock", err);
        res.status(500).send("Internal Server Error");
    }
});

// API 端点：处理本地仓库商品的发货操作
app.post('/api/local-items/ship', authenticateToken, async (req, res) => {
    try {
        const { itemId, shippingQuantity, destinationWarehouse, productName } = req.body;

        let objectId;
        try {
            objectId = new ObjectId(itemId);
        } catch (err) {
            return res.status(400).send("Invalid itemId format");
        }

        const updateResult = await localWarehouse.updateOne(
            { _id: objectId },
            { $inc: { availableQuantity: -shippingQuantity,
                actualStock: -shippingQuantity 
            } }
        );

        if (!updateResult.matchedCount) {
            return res.status(404).send("Item not found");
        }

        const operatedBy = req.user.username; // 获取当前操作用户

        const logEntry = {
            itemId: objectId,
            action: 'Item Shipped',
            details: {
                productName,
                shippingQuantity,
                destinationWarehouse
            },
            operatedBy, // 添加操作人信息
            timestamp: new Date()
        };
        await localLog.insertOne(logEntry);

        res.status(200).send("Item shipped and logged");
    } catch (err) {
        console.error("Error processing shipping", err);
        res.status(500).send("Internal Server Error");
    }
});



// API 端点：获取所有亚马逊仓库项目
app.get('/api/amazon-items', async (req, res) => {
    try {
        const items = await amazonWarehouse.find({}).toArray();
        res.json(items);
    } catch (err) {
        console.error("Error fetching amazon items", err);
        res.status(500).send("Error fetching amazon items");
    }
});

// API 端点：添加新项目到亚马逊仓库，并记录日志
app.post('/api/amazon-items', authenticateToken, async (req, res) => {
    try {
        const newItem = req.body;
        const result = await amazonWarehouse.insertOne(newItem);

        const operatedBy = req.user.username; // 获取当前操作用户

        // 添加操作日志
        const logEntry = {
            itemId: result.insertedId, // 使用插入的新项目 ID
            action: 'Item Added',
            details: newItem, // 或者只记录关键信息
            operatedBy, // 添加操作人信息
            timestamp: new Date()
        };
        await amazonLog.insertOne(logEntry);

        res.status(201).send("New amazon item added and logged");
    } catch (err) {
        console.error("Error inserting amazon item", err);
        res.status(500).send("Error inserting amazon item");
    }
});

// API 端点：获取亚马逊仓库的操作日志
app.get('/api/amazon-logs', async (req, res) => {
    try {
        const logs = await amazonLog.find({}).toArray();
        res.json(logs);
    } catch (err) {
        console.error("Error fetching amazon logs", err);
        res.status(500).send("Error fetching amazon logs");
    }
});

// API 端点：调整亚马逊仓库中的产品数量
app.post('/api/amazon-items/adjust-quantity', authenticateToken, async (req, res) => {
    try {
        const { itemId, quantityChange } = req.body;
        let objectId;
        try {
            objectId = new ObjectId(itemId);
        } catch (err) {
            return res.status(400).send("Invalid itemId format");
        }

        const originalItem = await amazonWarehouse.findOne({ _id: objectId });
        if (!originalItem) {
            return res.status(404).send("Item not found");
        }
        const updatedQuantity = Math.max(originalItem.availableQuantity + quantityChange, 0);

        const updateResult = await amazonWarehouse.updateOne(
            { _id: objectId },
            { $set: { availableQuantity: updatedQuantity } }
        );

        if (!updateResult.matchedCount) {
            return res.status(404).send("Item not found");
        }

        const changeType = quantityChange > 0 ? 'Increased' : 'Decreased';
        const operatedBy = req.user.username; // 获取操作人信息
        const logEntry = {
            itemId: objectId,
            action: `Quantity ${changeType}`,
            details: {
                productName: originalItem.productName,
                originalQuantity: originalItem.availableQuantity,
                updatedQuantity,
                quantityChange: Math.abs(quantityChange)
            },
            operatedBy, // 添加操作人
            timestamp: new Date()
        };
        await amazonLog.insertOne(logEntry);

        res.status(200).send("Product quantity adjusted and logged");
    } catch (err) {
        console.error("Error adjusting product quantity", err);
        res.status(500).send("Internal Server Error");
    }
});


// API 端点：处理亚马逊仓库商品的发货操作
app.post('/api/amazon-items/ship', authenticateToken, async (req, res) => {
    try {
        const { itemId, shippingQuantity, destinationWarehouse, productName } = req.body;

        let objectId;
        try {
            objectId = new ObjectId(itemId);
        } catch (err) {
            return res.status(400).send("Invalid itemId format");
        }

        const updateResult = await amazonWarehouse.updateOne(
            { _id: objectId },
            { $inc: { availableQuantity: -shippingQuantity } }
        );

        if (!updateResult.matchedCount) {
            return res.status(404).send("Item not found");
        }

        const operatedBy = req.user.username; // 从请求中获取操作人信息

        const logEntry = {
            itemId: objectId,
            action: 'Item Shipped',
            details: {
                productName,
                shippingQuantity,
                destinationWarehouse
            },
            operatedBy, // 添加操作人信息
            timestamp: new Date()
        };
        await amazonLog.insertOne(logEntry);
    
        res.status(200).send("Item shipped and logged");
    } catch (err) {
        console.error("Error processing shipping", err);
        res.status(500).send("Internal Server Error");
    }
});

// 用于记录本地日志的函数
const recordLocalLog = async (action, details, req) => {
    const logEntry = {
        timestamp: new Date(),
        action,
        operatedBy: req.user.username, // 从请求中获取操作人信息
        details
    };
    await localLog.insertOne(logEntry);
};

  
// API 端点：转移产品到亚马逊仓库，并记录日志
app.post('/api/transfer-to-amazon', authenticateToken, async (req, res) => {
    try {
        const item = req.body;

        // 检查亚马逊仓库中是否存在该商品
        const existingItem = await amazonWarehouse.findOne({ sku: item.sku });

        let isNewItem = false;
        if (existingItem) {
            // 如果存在，更新亚马逊仓库中的数量
            await amazonWarehouse.updateOne(
                { sku: item.sku },
                { $inc: { availableQuantity: item.transferQuantity
                
                } }
            );
        } else {
            // 如果不存在，添加新商品到亚马逊仓库
            const newItem = {
                ...item,
                availableQuantity: item.transferQuantity
            };
            delete newItem._id; // 移除 _id 字段
            await amazonWarehouse.insertOne(newItem);
            isNewItem = true; // 标记为新添加的商品
        }

        // 减少本地仓库中的数量
        await localWarehouse.updateOne(
            { sku: item.sku },
            { $inc: { availableQuantity: -item.transferQuantity,
                actualStock: -item.transferQuantity
            
            } }
        );

        const operatedBy = req.user.username; // 获取操作人信息

        // 记录本地日志
        const localLogDetails = {
            productName: item.productName,
            transferredQuantity: item.transferQuantity,
            destination: "Amazon Warehouse",
            operatedBy
        };
        await recordLocalLog('Item Transferred to Amazon', localLogDetails, req);

// 记录亚马逊日志
const amazonLogDetails = {
    productName: item.productName,
    quantityChanged: item.transferQuantity,
    action: isNewItem ? 'New Item Added' : 'Quantity Updated'
};

await amazonLog.insertOne({
    timestamp: new Date(),
    action: 'Stock Adjustment',
    operatedBy: req.user.username, // 直接在日志条目顶层添加 operatedBy 字段
    details: amazonLogDetails
});

        res.status(200).send("Item transferred to Amazon warehouse");
    } catch (err) {
        console.error("Error transferring item", err);
        res.status(500).send("Internal Server Error");
    }
});


// API 端点：转移产品到本地仓库，并记录日志
app.post('/api/transfer-to-local', authenticateToken, async (req, res) => {
    try {
        const item = req.body; // 接收完整的商品对象

        // 确保 item 对象包含所有必要的字段，特别是 sku 和 transferQuantity
        if (!item.sku || item.transferQuantity == null) {
            return res.status(400).send("Missing required fields: sku or transferQuantity");
        }

        // 检查亚马逊仓库中是否存在该商品以及数量是否足够
        const amazonItem = await amazonWarehouse.findOne({ sku: item.sku });
        if (!amazonItem || amazonItem.availableQuantity < item.transferQuantity) {
            return res.status(404).send("Item not found or insufficient quantity in Amazon warehouse");
        }

        // 减少亚马逊仓库中的数量
        await amazonWarehouse.updateOne(
            { sku: item.sku },
            { $inc: { availableQuantity: -item.transferQuantity } }
        );

        // 检查本地仓库中是否存在该商品
        const localItem = await localWarehouse.findOne({ sku: item.sku });

        if (localItem) {
            await localWarehouse.updateOne(
                { sku: item.sku },
                { 
                  $inc: { 
                    availableQuantity: item.transferQuantity,
                    actualStock: item.transferQuantity  // 同时更新实际库存
                  } 
                }
            );
        } else {
            await localWarehouse.insertOne({
                ...item,
                availableQuantity: item.transferQuantity,
                actualStock: item.transferQuantity  // 同时设置实际库存
            });
        }

        const operatedBy = req.user.username; // 获取操作人信息

        // 记录日志
        const logDetails = {
            productName: item.productName,
            transferredQuantity: item.transferQuantity,
            source: "Amazon Warehouse",
            destination: "Local Warehouse",
            operatedBy
        };

        // 记录亚马逊日志
        await recordAmazonLog('Item Transferred to Local', logDetails, req);

        // 记录本地日志
        await recordLocalLog('Item Received from Amazon', logDetails, req);

        res.status(200).send("Item transferred to local warehouse");
    } catch (err) {
        console.error("Error transferring item to local", err);
        res.status(500).send("Internal Server Error");
    }
});


// 用于记录亚马逊日志的函数
const recordAmazonLog = async (action, details, req) => {
    const logEntry = {
        timestamp: new Date(),
        action,
        operatedBy: req.user.username, // 从请求中获取操作人信息
        details
    };
    await amazonLog.insertOne(logEntry);
};
  
    
app.get('/api/local-logs', async (req, res) => {
    try {
      const logs = await localLog.find({}).toArray(); // 使用 localLog
      res.json(logs);
    } catch (err) {
      console.error("Error fetching local logs", err);
      res.status(500).send("Error fetching local logs");
    }
});



// API 端点：用户更改密码
app.post('/api/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const username = req.user.username;  // 从已验证的 token 中获取用户名

        // 查找用户
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(404).send('用户不存在');
        }

        // 验证旧密码
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).send('旧密码不正确');
        }

        // 加密新密码
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // 更新密码
        await usersCollection.updateOne({ username }, { $set: { password: hashedNewPassword } });

        res.send('密码已更新');
    } catch (err) {
        console.error("Error changing password", err);
        res.status(500).send('服务器错误');
    }
});



app.get('/api/suppliers', async (req, res) => {
    try {
        const suppliers = await suppliersCollection.find({}).toArray();
        res.json(suppliers);
    } catch (err) {
        console.error("Error fetching suppliers", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/api/suppliers', authenticateToken,async (req, res) => {
    const newSupplier = req.body;

    try {
        const result = await suppliersCollection.insertOne(newSupplier);
        res.status(201).json({ message: "Supplier created successfully", id: result.insertedId });
    } catch (err) {
        console.error("Error creating new supplier", err);
        res.status(500).send("Internal Server Error");
    }
});


// API 端点：创建新订单
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const newOrder = req.body;
        const result = await ordersCollection.insertOne(newOrder);
        
        // 您可以在这里记录操作日志或执行其他必要的操作

        res.status(201).json({ message: "Order created successfully", orderId: result.insertedId });
    } catch (err) {
        console.error("Error creating new order", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await ordersCollection.find({}).toArray();
        res.json(orders);
    } catch (err) {
        console.error("Error fetching orders", err);
        res.status(500).send("Internal Server Error");
    }
});

// API 端点：更新本地仓库中的产品的在途订单数量
app.post('/api/local-items/update-on-order', authenticateToken, async (req, res) => {
    try {
        const { itemId, onOrderQuantity } = req.body;
        let objectId;
        try {
            objectId = new ObjectId(itemId);
        } catch (err) {
            return res.status(400).send("Invalid itemId format");
        }

        const currentItem = await localWarehouse.findOne({ _id: objectId });
        if (!currentItem) {
            return res.status(404).send("Item not found");
        }

        const updateResult = await localWarehouse.updateOne(
            { _id: objectId },
            { $set: { onOrderQuantity: onOrderQuantity }}
        );

        if (!updateResult.matchedCount) {
            return res.status(404).send("Item not found");
        }

        // 添加操作日志
        const operatedBy = req.user.username; // 获取当前操作用户
        const logEntry = {
            itemId: objectId,
            action: 'On Order Quantity Updated',
            details: {
                before: currentItem.onOrderQuantity,
                after: onOrderQuantity
            },
            operatedBy,
            timestamp: new Date()
        };
        await localLog.insertOne(logEntry);

        res.status(200).send("On order quantity updated successfully");
    } catch (err) {
        console.error("Error updating on order quantity", err);
        res.status(500).send("Internal Server Error");
    }
});



// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});