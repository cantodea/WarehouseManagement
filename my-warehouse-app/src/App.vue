<template>
  <div>
    <!-- 登录界面 -->
    <div v-if="!isLoggedIn">
      <h2>登录</h2>
      <form @submit.prevent="login">
        <input v-model="username" type="text" placeholder="用户名" required>
        <input v-model="password" type="password" placeholder="密码" required>
        <button type="submit">登录</button>
      </form>
      <p v-if="loginError" class="error">{{ loginError }}</p>
    </div>

    <!-- 用户信息、修改密码和登出按钮 -->
    <div v-if="isLoggedIn" class="user-info">
      <span>欢迎, {{ username }}</span>
      <button @click="showChangePassword = true">修改密码</button>
      <button @click="logout">登出</button>
    </div>

    <!-- 修改密码的表单 -->
    <div v-if="showChangePassword" class="change-password-form">
      <div class="modal-content">
      <h3>修改密码</h3>
      <form @submit.prevent="changePassword">
        <input type="password" v-model="oldPassword" placeholder="旧密码" required>
        <input type="password" v-model="newPassword" placeholder="新密码" required>
        <button type="submit">提交</button>
        <button @click="showChangePassword = false">取消</button>
      </form>
      <p v-if="passwordChangeError" class="error">{{ passwordChangeError }}</p>
      </div>
    </div>



    <!-- 选择仓库界面 -->
    <div v-if="isLoggedIn">
      <select v-model="selectedWarehouse">
        <option disabled value="">请选择仓库</option>
        <option value="local">本地仓库</option>
        <option value="amazon">亚马逊仓库</option>
      </select>

      <!-- 根据选择显示对应的仓库组件 -->
      <local-warehouse v-if="selectedWarehouse === 'local'"></local-warehouse>
      <amazon-warehouse v-if="selectedWarehouse === 'amazon'"></amazon-warehouse>
    </div>
  </div>
</template>

<script>
import LocalWarehouse from './LocalWarehouse.vue';
import AmazonWarehouse from './AmazonWarehouse.vue';

export default {
  components: {
    LocalWarehouse,
    AmazonWarehouse
  },
  data() {
    return {
      isLoggedIn: false,
      username: '',
      password: '',
      selectedWarehouse: '',
      loginError: '',
      showChangePassword: false,
      oldPassword: '',
      newPassword: '',
      passwordChangeError: ''
    };
  },
  methods: {
    login() {
      this.$axios.post('/api/login', {
        username: this.username,
        password: this.password
      })
      .then(response => {
        localStorage.setItem('token', response.data.token);
        this.isLoggedIn = true;
        this.loginError = '';
      })
      .catch(error => {
        this.isLoggedIn = false;
        this.loginError = '登录失败：' + error.response.data.message;
      });
    },
    logout() {
      localStorage.removeItem('token');
      this.isLoggedIn = false;
      this.username = '';
      this.password = '';
      this.selectedWarehouse = '';
    },
    changePassword() {
    this.$axios.post('/api/change-password', {
      username: this.username,
      oldPassword: this.oldPassword,
      newPassword: this.newPassword
    })
    .then(() => {
      alert("密码已更改，请重新登录。");
      this.logout(); // 修改密码后登出
      this.showChangePassword = false; // 关闭修改密码的表单
    })
    .catch(error => {
      this.passwordChangeError = '修改密码失败：' + error.response.data.message;
    });
  },
  }
};
</script>

<style>
.error {
  color: red;
}

.user-info {
  text-align: right;
  padding: 10px;
  background-color: #f3f3f3;
  border-bottom: 1px solid #ddd;
}


</style>
