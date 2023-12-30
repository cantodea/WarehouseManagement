<template>
  <div class="return-management">
    <h1>退货管理</h1>
    <form @submit.prevent="submitReturn">
      <!-- 输入字段 -->
      <label for="productName">产品名称：</label>
      <input id="productName" v-model="returnData.productName" type="text" required>
  
      <label for="sku">SKU：</label>
      <input id="sku" v-model="returnData.sku" type="text" required>
  
      <label for="quantity">退货数量：</label>
      <input id="quantity" v-model.number="returnData.quantity" type="number" min="1" required>
  
      <label for="returnBy">退货方：</label>
      <input id="returnBy" v-model="returnData.returnBy" type="text" required>
  
      <label for="reason">退货原因：</label>
      <textarea id="reason" v-model="returnData.reason" required></textarea>

      <button type="submit">提交退货</button>
    </form>

    <div class="return-records">
      <h2>退货记录</h2>
      <ul>
        <li v-for="record in returnRecords" :key="record._id">
          <div>产品名称: {{ record.productName }}</div>
          <div>SKU: {{ record.sku }}</div>
          <div>数量: {{ record.quantity }}</div>
          <div>退货方: {{ record.returnBy }}</div>
          <div>原因: {{ record.reason }}</div>
          <button @click="openModal(record)" v-if="!record.isStockConfirmed">确认入库</button>
          <span v-else>已入库</span>
        </li>
      </ul>
    </div>

    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>确认入库</h2>

        <label for="availableQuantity">加入可用库存数量:</label>
        <input type="number" v-model="currentRecord.availableQuantity" placeholder="加入可用库存数量">

        <label for="defectiveQuantity">加入次品库存数量:</label>
        <input type="number" v-model="currentRecord.defectiveQuantity" placeholder="加入次品库存数量">


        <button @click="confirmStock">确认</button>
        <button @click="closeModal">关闭</button>
      </div>
    </div>
  </div>
</template>

  <script>
  export default {
    data() {
      return {
        returnData: {
          productName: '',
          sku: '',
          quantity: 1,
          reason: '',
          returnBy: ''
        },
        showModal: false,
        currentRecord: null,
        returnRecords: []
      };
    },
    methods: {
      submitReturn() {
        this.$axios.post('/api/returns', this.returnData)
          .then(response => {
            console.log('退货成功，服务器响应:', response);
            alert('退货成功');
            this.returnData = { productName: '', sku: '', quantity: 1, reason: '', returnBy: '' };
            this.fetchReturnRecords();  // 重新获取退货记录
          })
          .catch(error => {
            console.error('退货失败：', error);
            alert('退货失败：' + error.response.data.message);
          });
      },
      fetchReturnRecords() {
        this.$axios.get('/api/returns')
          .then(response => {
            this.returnRecords = response.data;
          })
          .catch(error => {
            console.error('获取退货记录失败：', error);
          });
      },
      openModal(record) {
        this.currentRecord = { ...record, availableQuantity: 0, defectiveQuantity: 0 };
        this.showModal = true;
      },
      closeModal() {
        this.showModal = false;
      },
      confirmStock() {
  const totalQuantity = parseInt(this.currentRecord.availableQuantity) + parseInt(this.currentRecord.defectiveQuantity);
  if (totalQuantity !== this.currentRecord.quantity) {
    alert('加入的可用库存数量和次品库存数量的总和必须等于退货数量');
    return;
  }

  // 准备发送给后端的数据
  const payload = {
    id: this.currentRecord._id,
    availableQuantity: this.currentRecord.availableQuantity,
    defectiveQuantity: this.currentRecord.defectiveQuantity
  };

  // 发送确认入库请求
  this.$axios.post('/api/confirm-return', payload)
    .then(() => {
      alert('入库确认成功');
      this.showModal = false;
      this.fetchReturnRecords();  // 重新获取退货记录以更新UI
    })
    .catch(error => {
      console.error('入库确认失败：', error);
      alert('入库确认失败：' + error.response.data.message);
    });
}

    },
    mounted() {
      this.fetchReturnRecords();
    }
  };
  </script>
  
  
  <style>
  .return-management {
    margin: 20px;
  }
  
  .return-management h1 {
    margin-bottom: 20px;
  }
  
  .return-management form {
    max-width: 600px;
    margin: auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  
  .return-management label {
    display: block;
    margin-bottom: 10px;
  }
  
  .return-management input,
  .return-management textarea {
    width: 100%;
    padding: 8px;
    margin-bottom: 20px;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  .return-management button {
    padding: 10px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .return-management button:hover {
    background-color: #0056b3;
  }
  
  .return-management button[disabled] {
    background-color: #aaa;
    cursor: not-allowed;
  }


  .return-records {
  margin-top: 40px;
}

.return-records h2 {
  margin-bottom: 20px;
}

.return-records ul {
  list-style: none;
  padding: 0;
}

.return-records li {
  margin-bottom: 10px;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
}
  </style>