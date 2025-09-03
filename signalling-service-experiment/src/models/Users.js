const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const Users = sequelize.define('users', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    fcm_device_token: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    gender:{
        type:  DataTypes.STRING,
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
    },
    phone: {
        type: DataTypes.STRING,
    },
    city: {
        type: DataTypes.STRING,
        lowercase: true,
    },
    state: {
        type: DataTypes.STRING,
        lowercase: true,
    },
    country: {
        type: DataTypes.STRING,
        lowercase: true,
    },
    zip: {
        type: DataTypes.INTEGER,
    },
    date_of_birth: {
        type: DataTypes.DATEONLY,
    },
    about: {
        type: DataTypes.TEXT,
    },
    role: {
        type: DataTypes.ENUM('patient', 'doctor', 'consultant', 'admin'),
        defaultValue: 'patient',
        allowNull: false,
    },
    profile_picture_url: {
        type: DataTypes.STRING,
    },
    cover_photo_url: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspend', 'delete'),
        defaultValue: 'active',
        lowercase: true,
    },
    languages: {
        type: DataTypes.JSON,
        lowercase: true,
    },
    search_history: {
        type: DataTypes.JSON,
    },
    google_id: {
        type: DataTypes.STRING,
    },
    apple_id: {
        type: DataTypes.STRING,
    },
    password_reset_token: {
        type: DataTypes.STRING,
    },
    password_token_expires: {
        type: DataTypes.DATE,
    },
    is_2_factor_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    last_login: {
        type: DataTypes.DATE,
    },
    // createdAt: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   field: "createdAt",
    //   defaultValue: DataTypes.NOW, // Default to the current timestamp
    // },
    // updatedAt: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   field: "updatedAt",
    //   defaultValue: DataTypes.NOW, // Default to the current timestamp
    // },
    // created_at: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   field: "created_at",
    //   defaultValue: DataTypes.NOW, // Default to the current timestamp
    // },
    // updated_at: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   field: "updated_at",
    //   defaultValue: DataTypes.NOW, // Default to the current timestamp
    // },
}, {
    // underscored: false,
    underscored: true,
    timestamps: true,
    tableName: 'users',
    defaultScope: {
        attributes: { exclude: ['password'] } // Exclude password by default
    },
    scopes: {
        withPassword: { // Include password when explicitly requested
            attributes: { include: ['password'] }
        }
    },
    indexes: [
        {
            unique: false,
            fields: ['full_name'],
            name: 'idx_full_name'
        },
        {
            unique: true,
            fields: ['email'],
            name: 'idx_email'
        },
        {
            unique: false,
            fields: ['phone'],
            name: 'idx_phone'
        },
        {
            unique: false,
            fields: ['role'],
            name: 'idx_role'
        },
        {
            unique: false,
            fields: ['status'],
            name: 'idx_status'
        },
        {
            unique: false,
            fields: ['last_login'],
            name: 'idx_last_login'
        }
    ],
});

// Hash password before saving to the database
Users.beforeCreate(async (user) => {
    const lastUser = await Users.findOne({ order: [['created_at', 'DESC']] });
    const lastUserId = lastUser ? parseInt(lastUser.id.split('_')[1]) : 0;
    user.id = `vtalix_${lastUserId + 1}`;
    
    if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});

Users.beforeUpdate(async (user) => {
    if (user.password && user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    }
});

// Compare entered password with stored hashed password
Users.prototype.isPasswordMatched = async function (enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate a reset token for password reset
Users.prototype.getPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.password_reset_token = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.password_token_expires = Date.now() + 30 * 60 * 1000; // Token expires in 30 minutes
    return resetToken;
};

module.exports = Users;