<template>
  <div>
    <div class="controls-container">
      <div class="search-container">
        <input type="text" v-model="searchQuery" placeholder="输入产品名或SKU">
        <button @click="searchItem">查询产品</button>
      </div>
      <button @click="fetchItems">查询全部产品</button>
      <button @click="openAddItemModal">添加新项目</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Product Name</th>
          <th>Purchase Order</th>
          <th>Outer Box Code</th>
          <th>SKU</th>
          <th>FNSKU</th>
          <th>Actual Stock</th>
          <th>Available Quantity</th>
          <th>On Order Quantity</th>
          <th>Revoked Stock</th>
          <th>Defective Stock</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredItems" :key="item._id" :class="{ 'low-stock': isLowStock(item.availableQuantity) }">
          <td>{{ item.productName }}</td>
          <td>{{ item.purchaseOrder }}</td>
          <td>{{ item.outerBoxCode }}</td>
          <td>{{ item.sku }}</td>
          <td>{{ item.fnsku }}</td>
          <td>{{ item.actualStock }}</td>
          <td>{{ item.availableQuantity }}</td>
          <td>{{ item.onOrderQuantity }}</td>
          <td>{{ item.revokedStock }}</td>
          <td>{{ item.defectiveStock }}</td>
          <td>
            <input type="number" v-model="item.transferQuantity" placeholder="数量">
            <button @click="transferItemToAmazon(item)">转移至亚马逊</button>
            <button @click="openAdjustStockModal(item)">调整库存</button>
          </td>
          <td>
            <button @click="openShippingModal(item)">发货</button>
          </td>
        </tr>

      </tbody>
    </table>

    <!-- 发货模态框 -->
    <div v-if="showShippingModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeShippingModal">&times;</span>
        <h3>发货详情</h3>
        <form @submit.prevent="shipItem">
          <input type="number" v-model="shippingDetails.shippingQuantity" placeholder="发货数量">
          <input type="text" v-model="shippingDetails.destinationWarehouse" placeholder="目的地仓库">
          <button type="submit">确认发货</button>
        </form>
      </div>
    </div>


  </div>

  <div v-if="showAdjustStockModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeAdjustStockModal">&times;</span>
        <h3>调整库存</h3>
        <form @submit.prevent="adjustStock">
          <label for="actualStock">实际库存</label>
          <input type="number" v-model="adjustStockDetails.actualStock" placeholder="Actual Stock">

          <label for="availableQuantity">可用数量</label>
          <input type="number" v-model="adjustStockDetails.availableQuantity" placeholder="Available Quantity">

          <label for="onOrderQuantity">订单中数量</label>
          <input type="number" v-model="adjustStockDetails.onOrderQuantity" placeholder="On Order Quantity">
          
          <label for="revokedStock">已撤销库存</label>
          <input type="number" v-model="adjustStockDetails.revokedStock" placeholder="Revoked Stock">

          <label for="defectiveStock">次品库存</label>
          <input type="number" v-model="adjustStockDetails.defectiveStock" placeholder="Defective Stock">

          <button type="submit">确认调整</button>
        </form>
      </div>
  </div>

  <div>
    <!-- 本地仓库操作日志部分 -->
    <div>
      <h3 @click="showLogs = !showLogs" style="cursor: pointer;">
        本地仓库操作日志
      </h3>

      <div v-if="showLogs">
        <!-- 日志筛选 -->
        <div>
          <select v-model="selectedOperatedBy">
            <option value="">所有操作人</option>
            <option v-for="operator in uniqueOperators" :key="operator" :value="operator">
              {{ operator }}
            </option>
          </select>
          <select v-model="selectedAction">
            <option value="">所有操作类型</option>
            <option v-for="action in uniqueActions" :key="action" :value="action">
              {{ action }}
            </option>
          </select>
        </div>

        <!-- 日志表格 -->
        <table>
          <thead>
            <tr>
              <th>操作时间</th>
              <th>操作类型</th>
              <th>详情</th>
              <th>操作人</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log._id">
              <td>{{ log.timestamp }}</td>
              <td>{{ log.action }}</td>
              <td>{{ log.details }}</td>
              <td>{{ log.operatedBy }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>


  <div>
    <!-- 添加新项目的模态框 -->
    <div v-if="showAddItemModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeAddItemModal">&times;</span>
        <h3>Add New Item</h3>
        <form @submit.prevent="addNewItem">
          <!-- 表单输入框 -->
          <input type="text" v-model="newItem.productName" placeholder="Product Name">
          <input type="text" v-model="newItem.purchaseOrder" placeholder="Purchase Order">
          <input type="text" v-model="newItem.outerBoxCode" placeholder="Outer Box Code">
          <input type="text" v-model="newItem.sku" placeholder="SKU">
          <input type="text" v-model="newItem.fnsku" placeholder="FNSKU">
          <label for="actualStock">实际库存</label>
          <input type="number" v-model="newItem.actualStock" placeholder="Actual Stock" id="actualStock">

          <label for="availableQuantity">可用数量</label>
          <input type="number" v-model="newItem.availableQuantity" placeholder="Available Quantity" id="availableQuantity">

          <label for="onOrderQuantity">订单中数量</label>
          <input type="number" v-model="newItem.onOrderQuantity" placeholder="On Order Quantity" id="onOrderQuantity">

          <label for="revokedStock">已撤销库存</label>
          <input type="number" v-model="newItem.revokedStock" placeholder="Revoked Stock" id="revokedStock">

          <label for="defectiveStock">次品库存</label>
          <input type="number" v-model="newItem.defectiveStock" placeholder="Defective Stock" id="defectiveStock">

          <button type="submit">Add Item</button>
        </form>
      </div>
    </div>
  </div>

</template>

<script>
export default {
  data() {
    return {
      items: [],
      searchQuery: '', // 用于存储搜索查询
      filteredItems: [], // 用于存储过滤后的产品
      newItem: {
        productName: '',
        purchaseOrder: '',
        outerBoxCode: '',
        sku: '',
        fnsku: '',
        actualStock: 0,
        availableQuantity: 0,
        onOrderQuantity: 0,
        revokedStock: 0,
        defectiveStock: 0
        
      },


      logs: [], // 在这里声明 logs 数组

      showShippingModal: false,
      shippingDetails: {
        itemId: '',
        shippingQuantity: 0,
        destinationWarehouse: ''
      },
      
      showAdjustStockModal: false,
      adjustStockDetails: {
        itemId: '',
        actualStock: 0,
        availableQuantity: 0,
        onOrderQuantity: 0,
        revokedStock: 0,
        defectiveStock: 0
      },

      showAddItemModal: false, // 控制添加新项目模态框的显示

      showLogs: false, // 新增的属性，用于控制日志部分的显示
      uniqueOperators: [],
      uniqueActions: [],
      selectedOperatedBy: '',
      selectedAction: '',
    };
  },
  mounted() {
    this.fetchItems();
    this.fetchLocalLogs(); // 加载组件时获取日志
  },
  computed: {
    filteredLogs() {
      return this.logs.filter(log => {
        return (this.selectedOperatedBy === '' || log.operatedBy === this.selectedOperatedBy) &&
               (this.selectedAction === '' || log.action === this.selectedAction);
      });
    }
  },
  methods: {
    openShippingModal(item) {
      this.showShippingModal = true;
      this.shippingDetails.itemId = item._id;
      this.shippingDetails.productName = item.productName;
      this.shippingDetails.shippingQuantity = 0;
      this.shippingDetails.destinationWarehouse = '';
    },
    closeShippingModal() {
      this.showShippingModal = false;
    },


    shipItem() {
      // 发货逻辑
      this.$axios.post('/api/local-items/ship', this.shippingDetails)
        .then(response => {
          console.log("Item shipped:", response.data);
          alert("商品发货成功！");
          this.closeShippingModal();
          this.fetchItems();
        })
        .catch(error => {
          console.error("Error shipping item:", error);
          alert("商品发货失败：" + error.response.data.message);
        });
    },
    fetchItems() {
    this.$axios.get('/api/local-items')
      .then(response => {
        // 从 API 获取数据
        this.items = response.data.map(item => ({ ...item, transferQuantity: 0 }));

        // 如果有搜索查询，则过滤项目，否则显示所有项目
        if (this.searchQuery && this.searchQuery.trim()) {
          this.filteredItems = this.items.filter(item => 
            item.productName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        } else {
          this.filteredItems = this.items; // 没有查询时显示所有项目
        }
      })
      .catch(error => {
        console.error("Error fetching items:", error);
      });
    },
    isLowStock(quantity) {
      return quantity < 10; // 低于10的库存量视为库存不足
    },


  searchItem() {
      console.log("搜索查询: ", this.searchQuery); // 日志搜索查询
      if (this.searchQuery && this.searchQuery.trim()) {
        this.filteredItems = this.items.filter(item =>
          item.productName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          item.sku.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
        console.log("过滤后的项目: ", this.filteredItems); // 日志过滤后的项目
      } else {
        this.filteredItems = this.items;
      }
    },


    openAddItemModal() {
      this.showAddItemModal = true;
    },
    closeAddItemModal() {
      this.showAddItemModal = false;
    },


    addNewItem() {
      this.$axios.post('/api/local-items', this.newItem)
        .then(response => {
          console.log("Item added:", response.data);
          alert("商品添加成功！");
          this.resetNewItem();
          this.fetchItems();
        })
        .catch(error => {
          console.error("Error adding item:", error);
          alert("添加商品失败：" + error.response.data.message);
        });
    },
    resetNewItem() {
      this.newItem = {
        productName: '', 
        purchaseOrder: '', 
        outerBoxCode: '',
        sku: '',
        fnsku: '',
        actualStock: 0,
        availableQuantity: 0,
        onOrderQuantity: 0,
        revokedStock: 0,
        defectiveStock: 0
      };
    },
    transferItemToAmazon(item) {
      const itemToTransfer = {
        ...item,
        availableQuantity: item.transferQuantity
      };

      this.$axios.post('/api/transfer-to-amazon', itemToTransfer)
        .then(response => {
          console.log("Item transferred:", response.data);
          alert("商品成功转移到亚马逊仓库！");
          this.fetchItems();
        })
        .catch(error => {
          console.error("Error transferring item:", error);
          alert("转移商品失败：" + error.response.data.message);
        });
    },

    fetchLocalLogs() {
      this.$axios.get('/api/local-logs')
        .then(response => {
          // 首先，保存原始日志数据
          this.logs = response.data;

          // 接下来，根据时间戳对日志进行倒序排序
          this.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          // 从排序后的日志数据中提取唯一的操作人和操作类型
          this.uniqueOperators = [...new Set(this.logs.map(log => log.operatedBy))];
          this.uniqueActions = [...new Set(this.logs.map(log => log.action))];
        })
        .catch(error => {
          console.error("Error fetching logs:", error);
        });
    },

    openAdjustStockModal(item) {
    this.showAdjustStockModal = true;
    this.adjustStockDetails = {
      itemId: item._id,
      actualStock: item.actualStock,
      availableQuantity: item.availableQuantity,
      onOrderQuantity: item.onOrderQuantity,
      revokedStock: item.revokedStock,
      defectiveStock: item.defectiveStock
    };
  },
  closeAdjustStockModal() {
    this.showAdjustStockModal = false;
  },
  adjustStock() {
    // 发送库存调整请求
    this.$axios.post('/api/local-items/adjust-stock', this.adjustStockDetails)
      .then(response => {
        console.log("Stock adjusted:", response.data);
        alert("库存调整成功！");
        this.closeAdjustStockModal();
        this.fetchItems();
      })
      .catch(error => {
        console.error("Error adjusting stock:", error);
        alert("库存调整失败：" + error.response.data.message);
      });
  },
  }
};
</script>

<style>
/* 根据需要添加样式 */
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f4f4f4;
}

.modal-content label {
  display: block;
  margin-top: 10px;
}

.modal-content input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
}

.low-stock {
  background-color: #ffcccc; /* 库存不足时行的背景颜色 */
}
</style>
