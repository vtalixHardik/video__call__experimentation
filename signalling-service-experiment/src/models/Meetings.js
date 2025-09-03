const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
 
const Meetings = sequelize.define('meetings', {
    id:{
        type:DataTypes.BIGINT,
        primaryKey: true
    },
    meeting_status:{
        type:DataTypes.ENUM('active', 'inactive', 'vacant', 'scheduled'),
        defaultValue: 'scheduled'
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    start_time:{
        type: DataTypes.STRING,
    },
    patient_id:{
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: "patients",
            key: "id"
        }
    },
    doctor_id:{
        type: DataTypes.STRING,
        allowNull: false,
        references:{
            model: "doctors",
            key: "id",
        }
    },
    appointment_id:{
        type: DataTypes.STRING,
        allowNull: false,
        references:{
            model: "appointments",
            key:"id"
        }
    },
    doctor_name:{
        type: DataTypes.STRING,
    },
    patient_name:{
        type: DataTypes.STRING,
    },
    patient_join_time:{
        type: DataTypes.JSON,
    },
    doctor_join_time:{
        type: DataTypes.JSON
    },
    patient_leave_time:{
        type: DataTypes.JSON
    },
    doctor_leave_time:{
        type: DataTypes.JSON
    },
    patient_socket_id:{
        type: DataTypes.STRING,
    },
    doctor_socket_id:{
        type: DataTypes.STRING,
    },
    doctor_offer_sdp: {
        type: DataTypes.JSON,
        allowNull: true
    },
    doctor_answer_sdp: {
        type: DataTypes.JSON,
        allowNull: true
    },
    patient_offer_sdp: {
        type: DataTypes.JSON,
        allowNull: true
    },
    patient_answer_sdp: {
        type: DataTypes.JSON,
        allowNull: true
    },
    chats: {
        type: DataTypes.JSON,
        allowNull: true
    }
},{
    underscored: true,
    timestamps: true,
    tableName: 'meetings',
    indexes: [
        { fields: ['doctor_id'] },
        { fields: ['patient_id'] },
        { fields: ['doctor_name'] },
        { fields: ['patient_name'] },
        { fields: ['start_time'] },
        { fields: ['meeting_status'] },
    ]
});
 
module.exports = Meetings;