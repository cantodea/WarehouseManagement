<template>
    <div class="return-management">
      <h1>退货管理</h1>
      <form @submit.prevent="submitReturn">
        <label for="productName">产品名称：</label>
        <input id="productName" v-model="returnData.productName" type="text" required>
  
        <label for="sku">SKU：</label>
        <input id="sku" v-model="returnData.sku" type="text" required>
  
        <label for="quantity">退货数量：</label>
        <input id="quantity" v-model.number="returnData.quantity" type="number" min="1" required>
  
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
          <div>原因: {{ record.reason }}</div>
        </li>
      </ul>
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
          reason: ''
        },
        returnRecords: []  // 新增：存储退货记录
      };
    },
    methods: {
      submitReturn() {
      // 使用 axios 发送 POST 请求到后端
      this.$axios.post('/api/returns', this.returnData)
    .then(response => { // 使用 response 变量
      console.log('退货成功，服务器响应:', response);
      alert('退货成功');
      // 清空表单
      this.returnData = { productName: '', sku: '', quantity: 1, reason: '' };
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
    }
  },
  mounted() {
    this.fetchReturnRecords();  // 组件挂载后获取退货记录
  
  
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