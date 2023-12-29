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
        }
      };
    },
    methods: {
      submitReturn() {
        console.log('提交退货信息：', this.returnData);
        // 在这里发送退货信息到后端
        // this.$axios.post('/api/returns', this.returnData)
        //  .then(response => {
        //    alert('退货成功');
        //    // 清空表单或其他操作
        //  })
        //  .catch(error => {
        //    console.error('退货失败：', error);
        //  });
      }
    }
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