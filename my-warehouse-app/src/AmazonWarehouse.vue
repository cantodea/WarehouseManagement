<template>
  <div>
    <h2>亚马逊仓库</h2>

    <!-- 添加新商品的表单 -->
    <div>
      <h3>Add New Amazon Item</h3>
      <form @submit.prevent="addAmazonItem">
        <input type="text" v-model="newItem.storeAccount" placeholder="店铺/卖家账号">
        <input type="text" v-model="newItem.productName" placeholder="商品名称">
        <input type="text" v-model="newItem.sku" placeholder="SKU">
        <input type="text" v-model="newItem.fnsku" placeholder="FNSKU">
        <input type="number" v-model="newItem.availableQuantity" placeholder="可用数量">
        <button type="submit">添加商品</button>
      </form>
    </div>

    <!-- 商品列表 -->
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>店铺/卖家账号</th>
          <th>商品名称</th>
          <th>SKU</th>
          <th>FNSKU</th>
          <th>可用数量</th>
          <th>更新数量</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item._id">
          <td>{{ item._id }}</td>
          <td>{{ item.storeAccount }}</td>
          <td>{{ item.productName }}</td>
          <td>{{ item.sku }}</td>
          <td>{{ item.fnsku }}</td>
          <td>{{ item.availableQuantity }}</td>
          <td>
            <input type="number" v-model="item.adjustmentQuantity" placeholder="调整数量">
            <button @click="adjustQuantity(item._id, item.adjustmentQuantity)">调整</button>
          </td>
          <td>
            <input type="number" v-model="item.transferQuantity" placeholder="转移数量">
            <button @click="transferToLocal(item)">转移到本地仓库</button>
            <!-- 发货按钮 -->
            <button @click="showShippingModal(item)">发货</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 发货模态框 -->
    <div v-if="showModal" class="modal">
      <h3>发货详情</h3>
      <input type="number" v-model="modalShippingDetails.shippingQuantity" placeholder="发货数量">
      <input type="text" v-model="modalShippingDetails.destinationWarehouse" placeholder="目的地仓库">
      <button @click="shipItem(modalShippingDetails)">确认发货</button>
      <button @click="showModal = false">取消</button>
    </div>

    <!-- 操作日志展示 -->
    <div>
      <h3 @click="showLogs = !showLogs" style="cursor: pointer;">
        操作日志
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
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      items: [],
      newItem: {
        storeAccount: '',
        productName: '',
        sku: '',
        fnsku: '',
        availableQuantity: 0
      },
      showModal: false,
      modalShippingDetails: {
        itemId: '',
        shippingQuantity: 0,
        destinationWarehouse: ''
      },
      logs: [],
      showLogs: false,
      uniqueOperators: [],
      uniqueActions: [],
      selectedOperatedBy: '',
      selectedAction: ''
    };
  },
  mounted() {
    this.fetchAmazonItems();
    this.fetchLogs();
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
    fetchAmazonItems() {
      axios.get('/api/amazon-items')
        .then(response => {
          this.items = response.data;
        })
        .catch(error => {
          console.error("Error fetching amazon items:", error);
        });
    },
    addAmazonItem() {
      axios.post('/api/amazon-items', this.newItem)
        .then(response => {
          console.log("New amazon item added:", response.data);
          alert("商品添加成功！");
          this.fetchAmazonItems();
        })
        .catch(error => {
          console.error("Error adding amazon item:", error);
          alert("添加商品失败：" + error.response.data.message);
        });
    },
    showShippingModal(item) {
      this.showModal = true;
      this.modalShippingDetails.itemId = item._id;
      this.modalShippingDetails.shippingQuantity = 0;
      this.modalShippingDetails.destinationWarehouse = '';
    },
    shipItem(details) {
      if (!details.shippingQuantity || !details.destinationWarehouse) {
        console.error("Error: Missing shipping details");
        return;
      }
      axios.post('/api/amazon-items/ship', details)
        .then(response => {
          console.log("Item shipped:", response.data);
          alert("商品发货成功！");
          this.showModal = false;
          this.fetchAmazonItems();
          this.fetchLogs();
        })
        .catch(error => {
          console.error("Error shipping item:", error);
          alert("商品发货失败：" + error.response.data.message);
        });
    },
    adjustQuantity(itemId, quantity) {
    // 检查输入是否有效
    if (quantity === null || quantity === '' || isNaN(quantity)) {
      alert("请输入有效的调整数量");
      return;
    }

    axios.post('/api/amazon-items/adjust-quantity', { itemId, quantityChange: quantity })
      .then(() => {
        alert("库存调整成功！");
        this.fetchAmazonItems();
      })
      .catch(error => {
        console.error("Error adjusting item quantity:", error);
        alert("库存调整失败：" + error.response.data.message);
      });
  },
    transferToLocal(item) {
      if (item.transferQuantity <= 0) {
        alert("请输入有效的转移数量");
        return;
      }
      const transferData = {
        productName: item.productName,
        sku: item.sku,
        fnsku: item.fnsku,
        transferQuantity: item.transferQuantity
      };
      axios.post('/api/transfer-to-local', transferData)
        .then(response => {
          console.log("Item transferred to local warehouse:", response.data);
          alert("成功转移到本地仓库！");
          this.fetchAmazonItems();
        })
        .catch(error => {
          console.error("Error transferring item to local:", error);
          alert("转移到本地仓库失败：" + error.response.data.message);
        });
    },
    fetchLogs() {
      axios.get('/api/amazon-logs')
        .then(response => {
          this.logs = response.data;
          this.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          this.uniqueOperators = [...new Set(this.logs.map(log => log.operatedBy))];
          this.uniqueActions = [...new Set(this.logs.map(log => log.action))];
        })
        .catch(error => {
          console.error("Error fetching logs:", error);
        });
    }
  }
};
</script>

<style>
/* 添加样式 */
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

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border: 1px solid #ddd;
  z-index: 1000;
}
</style>
