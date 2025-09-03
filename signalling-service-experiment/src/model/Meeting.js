
const mongoose = require("mongoose");

const documentSchema = mongoose.Schema({
    _id: {
        type: String,
        required: true,

    },
    appointment_id: {
        type: String,
        required: true,

    },
    user_one_name: {
        type: String,
        // required: true,

    },
    user_two_name: {
        type: String,
        // required: true,

    },
    user_one_socket: {
        type: String,
        // required: true,

    },
    user_two_socket: {
        type: String,
        // required: true,

    },
    chats: {
        type: Array,
        // required: true,

    },
    data: {
        type: Object,
        // required: true,
        
    },
});

const collectionName = "meetings";

const document = mongoose.model(collectionName, documentSchema);

module.exports = document;