const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Appointments = sequelize.define(
  "appointments",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
    },
    doctor_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "doctors",
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    appointment_type: {
      type: DataTypes.ENUM("individual", "teen", "couple"),
    },
    appointment_status: {
      type: DataTypes.ENUM("scheduled", "rescheduled", "completed", "cancelled"),
      defaultValue: "scheduled",
    },
    appointment_link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cancelled_on: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    cancellation_reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    appointment_description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    appointment_medium: {
      type: DataTypes.ENUM("video", "audio", "chat"),
      defaultValue: "video",
    },
    doctor_completed_appointment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    patient_completed_appointment: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    feedback_heading: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    feedback_description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    summary: {
      type: DataTypes.STRING,
      allowNull: true,
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
  },
  {
    underscored: true,
    timestamps: true,
    tableName: "appointments",
    indexes: [
      { fields: ["patient_id"], name: "idx_patient_id" },
      { fields: ["doctor_id"], name: "idx_doctor_id" },
      { fields: ["date"], name: "idx_date" },
      { fields: ["appointment_status"], name: "idx_appointment_status" },
      { fields: ["is_active"], name: "idx_is_active" },
    ],
    // hooks: {
    //   beforeUpdate: (appointment) => {
    //     appointment.updatedAt = new Date();
    //     appointment.updated_at = new Date();
    //   },
    // },
  }
);

// Automatically generate the ID for new appointments
Appointments.beforeCreate(async (appointment) => {
  const lastAppointment = await Appointments.findOne({
    order: [["created_at", "DESC"]],
  });
  const lastAppointmentId = lastAppointment
    ? parseInt(lastAppointment.id.split("_")[2])
    : 0;
  appointment.id = `vtalix_appointment_${lastAppointmentId + 1}`;
});

module.exports = Appointments;
