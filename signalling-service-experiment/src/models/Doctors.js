const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Doctors = sequelize.define('doctors', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    main_specialization: {
        type: DataTypes.STRING,
        allowNull: false,
        lowercase: true
    },
    expertise: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        validate: {
            notNull: { msg: "Please provide at least 5 expertise" }
        }
    },
    experience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: "Please enter experience in years" }
        }
    },
    clinic_address_complete: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: "Please enter the complete address of the clinic" }
        }
    },
    clinic_phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: "Please enter the phone number of the clinic" }
        }
    },
    registration_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: "Please enter the registration/license number" }
        }
    },
    registration_council: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: { msg: "Council name is needed for creating the profile" }
        }
    },
    registration_year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notNull: { msg: "Please provide the registration year" }
        }
    },
    registration_file_url: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    identity_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    identity_file_url: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null
    },
    is_approved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    profile_questions: {
        type: DataTypes.JSON,
        allowNull: true
    },
    total_patients_handled: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    patients_handled: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    thoughts_i_can_help_with: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
    },
    total_earnings: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    balance: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    price: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    discount_on_3_appointments: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    discount_on_5_appointments: {
        type: DataTypes.INTEGER,
        defaultValue: 8
    },
    total_appointments: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_appointments_cancelled: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    total_appointments_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    rating: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    rejection_heading: {
        type: DataTypes.STRING,
        defaultValue: null
    },
    rejection_notes: {
        type: DataTypes.TEXT,
        defaultValue: null
    },
    // expertise_tag_1: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
    // expertise_tag_2: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
    // expertise_tag_3: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
    // expertise_tag_4: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
    // expertise_tag_5: {
    //     type: DataTypes.STRING,
    //     allowNull: true
    // },
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
}, {
    // underscored: false,
    underscored: true,
    timestamps: true,
    tableName: 'doctors',
    indexes: [
        { fields: ['id'] },
        { fields: ['main_specialization'] },
        { fields: ['is_approved'] },
        { fields: ['total_appointments_completed'] },
        { fields: ['rating'] },
        { fields: ['expertise'] }
    ],
    // hooks: {
    //     beforeUpdate: (doctor) => {
    //         const expertise = doctor.expertise || [];
    //         doctor.expertise_tag_1 = expertise[0] || null;
    //         doctor.expertise_tag_2 = expertise[1] || null;
    //         doctor.expertise_tag_3 = expertise[2] || null;
    //         doctor.expertise_tag_4 = expertise[3] || null;
    //         doctor.expertise_tag_5 = expertise[4] || null;
    //         doctor.updatedAt = new Date();
    //         doctor.updated_at = new Date();
    //     }
    // }
});

module.exports = Doctors;
