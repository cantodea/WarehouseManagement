module.exports = (usersCollection) => {
    const express = require('express');
    const router = express.Router();

    // 将 usersCollection 传递给 userController
    const userController = require('./userController')(usersCollection);

    // 路由定义
    router.post('/login', userController.login);
    router.get('/profile/:id', userController.getUserProfile);

    return router;
};
