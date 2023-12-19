const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 创建用户模型的 Schema
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // 您可以根据需要添加更多字段，如 email, createdAt 等
});

// 如果需要，您可以在这里添加一些方法，例如验证用户密码的方法

// 创建并导出用户模型
module.exports = mongoose.model('User', userSchema);
