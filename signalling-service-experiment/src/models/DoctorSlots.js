const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DoctorSlots = sequelize.define('doctorslots', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        // allowNull: false,
    },
    doctor_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'doctors',
            key: 'id',
        },
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    slots: {
        type: DataTypes.JSON, 
        allowNull: false,
    },
    // createdAt: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   field: "createdAt",
    //   defaultValue: DataTypes.NOW,
    // },
    // updatedAt: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   field: "updatedAt",
    //   defaultValue: DataTypes.NOW,
    // },
    // created_at: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   field: "created_at",
    //   defaultValue: DataTypes.NOW,
    // },
    // updated_at: {
    //   type: DataTypes.DATE,
    //   allowNull: false,
    //   field: "updated_at",
    //   defaultValue: DataTypes.NOW,
    // },
    // the slots object will look something like this
    /* 
        id,
        startTime,
        endTime,
        patientId, // if patient has blocked the slot,
        blockedUntil, // if patient has booked the slot, this will be the date until which the slot is booked which will at most be 15 mins
        appointmentId: if the slot is booked, the appointment id will be stored here and the slot will be unavailable for other users.
    */
}, {
    underscored: true,
    timestamps: true,
    tableName: 'doctorslots',
    indexes: [
        { fields: ['doctor_id'] },             // Index for faster queries by doctor
        { fields: ['date'] },                  // Index for faster queries by date
        { fields: ['id'] },                    // Index for querying by slot ID
        { fields: ['doctor_id', 'date'], unique: true }, // Composite index for doctor/date
    ],
    // hooks: {
    //   beforeUpdate: (slot) => {
    //     slot.updatedAt = new Date();
    //     slot.updated_at = new Date();
    //   },
    // },
});

DoctorSlots.beforeCreate(async (slot)=>{
    // find the last slot created.
    const lastSlot = await DoctorSlots.findOne({order: [['id', 'DESC']]});
    // if last slot exists, increment the id by 1
    const lastSlotId = lastSlot ? parseInt(lastSlot.id.split('_')[2]) : 0;
    slot.id = `vtalix_slot_${lastSlotId + 1}`;
});

module.exports = DoctorSlots;
