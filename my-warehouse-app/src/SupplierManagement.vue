<template>
  <div>
    <div class="supplier-selection">
      <label for="supplier-select">选择供应商:</label>
      <select id="supplier-select" v-model="selectedSupplier" @change="selectSupplier">
        <option disabled value="">请选择供应商</option>
        <option v-for="supplier in suppliers" :key="supplier._id" :value="supplier._id">
          {{ supplier.Name }}
        </option>
      </select>
    </div>

    <div class="supplier-details" v-if="selectedSupplierDetails">
      <h2>供应商详情</h2>
      <p>名称: {{ selectedSupplierDetails.Name }}</p>
      <p>联系人: {{ selectedSupplierDetails.ContactInfo?.ContactPerson }}</p>
      <p>电话: {{ selectedSupplierDetails.ContactInfo?.Phone }}</p>
      <p>邮箱: {{ selectedSupplierDetails.ContactInfo?.Email }}</p>
      <div v-if="selectedSupplierDetails.Products">
        <h3>产品:</h3>
        <ul>
          <li v-for="product in selectedSupplierDetails.Products" :key="product.SKU">
            {{ product.Name }} - {{ product.Description }} - 价格: {{ product.Price }}
            <button @click="openOrderModal(selectedSupplierDetails._id, product.SKU)">增加订单</button>
          </li>
        </ul>
      </div>
      <p v-if="selectedSupplierDetails.Notes">备注: {{ selectedSupplierDetails.Notes }}</p>
      <button @click="showEditModal = true">更新供应商信息</button>
      <button @click="deleteSupplier">删除供应商</button>
    </div>

    <!-- 编辑供应商信息的模态框 -->
    <div v-if="showEditModal" class="modal">
      <div class="modal-content">
        <h3>编辑供应商信息</h3>
        <form @submit.prevent="updateSupplier">
          <div>
            <label>名称:</label>
            <input type="text" v-model="editableSupplierDetails.Name">
          </div>
          <!-- 联系人 -->
          <div>
            <label>联系人:</label>
            <input type="text" v-model="editableSupplierDetails.ContactInfo.ContactPerson">
          </div>
          <!-- 电话 -->
          <div>
            <label>电话:</label>
            <input type="text" v-model="editableSupplierDetails.ContactInfo.Phone">
          </div>
          <!-- 邮箱 -->
          <div>
            <label>邮箱:</label>
            <input type="email" v-model="editableSupplierDetails.ContactInfo.Email">
          </div>
          <!-- 其他需要编辑的字段 -->
          <button type="submit">保存更改</button>
          <button @click="showEditModal = false">取消</button>
        </form>
      </div>
    </div>

    <!-- 创建订单的模态框 -->
    <div v-if="showOrderModal" class="modal">
      <div class="modal-content">
        <h3>创建订单</h3>
        <form @submit.prevent="submitOrder">
          <div>
            <label>数量:</label>
            <input type="number" v-model="orderDetails.quantity" min="1">
          </div>
          <div>
            <label>快递号:</label>
            <input type="text" v-model="orderDetails.trackingNumber">
          </div>
          <div>
            <label>快递种类:</label>
            <select v-model="orderDetails.carrier">
              <option value="UPS">UPS</option>
              <option value="FedEx">FedEx</option>
              <option value="DHL">DHL</option>
              <!-- 其他选项 -->
            </select>
          </div>
          <button type="submit">提交订单</button>
          <button @click="showOrderModal = false">取消</button>
        </form>
      </div>
    </div>

    <div class="order-list">
      <h2>订单列表</h2>
      <ul>
        <li v-for="order in orders" :key="order._id">
          订单ID: {{ order._id }},
          供应商ID: {{ order.supplierId }},
          产品ID: {{ order.productId }},
          数量: {{ order.quantity }},
          追踪号: {{ order.trackingNumber }},
          快递: {{ order.carrier }},
          状态: {{ order.isReceived ? '已收货' : '未收货' }}
          <button v-if="!order.isReceived" @click="confirmReceipt(order)">确认收货</button>
          <button @click="trackShipment(order.trackingNumber)">查询快递</button>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      suppliers: [],
      selectedSupplier: null,
      selectedSupplierDetails: null,
      showEditModal: false,
      showOrderModal: false,
      editableSupplierDetails: {},
      orderDetails: {
        supplierId: '',
        productId: '',
        quantity: 1,
        trackingNumber: '',
        carrier: 'UPS',
        localItems: []// 存储本地仓库的产品数据
      },
      orders: [] // 存储订单数据
    };
  },
  async created() {
    await this.fetchSuppliers();
    await this.fetchOrders(); // 在组件创建时获取订单数据
    await this.fetchLocalItems(); // 在组件创建时获取本地库存产品
  },
  methods: {
    async fetchSuppliers() {
      try {
        const response = await this.$axios.get('/api/suppliers');
        this.suppliers = response.data;
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    },
    selectSupplier() {
      const supplier = this.suppliers.find(s => s._id === this.selectedSupplier);
      this.selectedSupplierDetails = supplier ? {...supplier} : null;
      this.editableSupplierDetails = supplier ? {...supplier} : {};
    },
    async updateSupplier() {
      if (!this.selectedSupplier) return;
      try {
        await this.$axios.put(`/api/suppliers/${this.selectedSupplier}`, this.editableSupplierDetails);
        alert("Supplier updated successfully");
        this.showEditModal = false;
        this.fetchSuppliers();
      } catch (error) {
        console.error("Error updating supplier:", error);
      }
    },
    async deleteSupplier() {
      if (!this.selectedSupplier) return;
      try {
        await this.$axios.delete(`/api/suppliers/${this.selectedSupplier}`);
        alert("Supplier deleted successfully");
        this.fetchSuppliers();
      } catch (error) {
        console.error("Error deleting supplier:", error);
      }
    },
    openOrderModal(supplierId, productId) {
      this.orderDetails.supplierId = supplierId;
      this.orderDetails.productId = productId;
      this.showOrderModal = true;
    },
    submitOrder() {
      const orderData = {...this.orderDetails};

      // 在本地库存中搜索相同SKU的产品
      const localItem = this.localItems.find(item => item.sku === this.orderDetails.productId);
      if (localItem) {
        // 更新"On Order Quantity"
        this.$axios.post('/api/local-items/update-on-order', {
          itemId: localItem._id,
          onOrderQuantity: localItem.onOrderQuantity + this.orderDetails.quantity
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(() => {
          // 创建订单
          this.createOrder(orderData);
        }).catch(error => {
          console.error('Error updating local stock', error);
        });
      } else {
        // 直接创建订单
        this.createOrder(orderData);
      }
    },

    async checkAndUpdateLocalStock(productId, quantity) {
      // 获取本地仓库信息
      const localItemResponse = await this.$axios.get(`/api/local-items/${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (localItemResponse.data) {
        const localItem = localItemResponse.data;
        // 更新"On Order Quantity"
        await this.$axios.post('/api/local-items/update-on-order', {
          itemId: localItem._id,
          onOrderQuantity: localItem.onOrderQuantity + quantity
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
    },
    resetOrderForm() {
      this.orderDetails = {
        supplierId: '',
        productId: '',
        quantity: 1,
        trackingNumber: '',
        carrier: 'UPS'
      };
    },

    async fetchOrders() {
      try {
        const response = await this.$axios.get('/api/orders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.orders = response.data; // 存储订单数据
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    },

    async fetchLocalItems() {
      try {
        const response = await this.$axios.get('/api/local-items', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        this.localItems = response.data;
      } catch (error) {
        console.error("Error fetching local items:", error);
      }
    },

    createOrder(orderData) {
      this.$axios.post('/api/orders', orderData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(response => {
        console.log('Order created successfully', response.data);
        this.showOrderModal = false;
        this.resetOrderForm();
        this.fetchSuppliers();
      })
      .catch(error => {
        console.error('Error creating order', error);
      });
    },

    confirmReceipt(order) {
    const orderId = order._id; // 提取订单的 _id
    this.$axios.patch(`/api/orders/${orderId}/receive`, {}, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(() => {
        alert('订单已确认收货');
        this.fetchOrders(); // 重新获取订单数据以更新界面
    })
    .catch(error => {
        console.error('Error confirming order receipt', error);
    });
},

    trackShipment(trackingNumber) {
      this.$axios.post('/api/track-shipment', { trackingNumber })
        .then(response => {
          console.log(response.data); // 处理并显示快递信息
          // 可以在这里更新UI或通知用户
        })
        .catch(error => {
          console.error('Error querying shipment', error);
          // 处理错误
        });
    }
  },
};
</script>



<style>
  .supplier-selection {
    margin-bottom: 20px;
  }
  .supplier-details {
    margin-top: 20px;
  }
  .order-list {
    margin-top: 20px;
  }
  .order-list h2 {
    margin-bottom: 10px;
  }
  .order-list ul {
    list-style-type: none;
    padding: 0;
  }
  .order-list li {
    margin-bottom: 15px;
    border: 1px solid #ccc;
    padding: 10px;
  }
</style>