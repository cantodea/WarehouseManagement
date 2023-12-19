module.exports = function(usersCollection) {
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const { ObjectId } = require('mongodb'); // 引入 ObjectId

    return {
        // 用户登录
        login: async (req, res) => {
            try {
                const { username, password } = req.body;

                // 检查用户是否存在
                const user = await usersCollection.findOne({ username });
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                console.log("Found user username:", user.username); // 添加这行来检查用户名

                // 验证密码
                const isPasswordCorrect = await bcrypt.compare(password, user.password);
                if (!isPasswordCorrect) {
                    return res.status(400).json({ message: "Invalid credentials" });
                }

                // 生成 JWT token，包含 id 和 username
                const token = jwt.sign(
                    { id: user._id, username: user.username }, // 在这里添加了 username
                    'yourSecretKey',
                    { expiresIn: '1h' }
                );

                // 从响应中移除密码
                const { password: _, ...userResponse } = user;

                res.json({ message: "User logged in successfully", user: userResponse, token });
            } catch (err) {
                console.error(err);
                res.status(500).send("Error logging in user");
            }
        },

        // 获取用户信息
        getUserProfile: async (req, res) => {
            try {
                const userId = req.params.id;

                const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }

                // 从响应中移除密码
                const { password: _, ...userResponse } = user;

                res.json({ user: userResponse });
            } catch (err) {
                console.error(err);
                res.status(500).send("Error fetching user profile");
            }
        }
    };
};
