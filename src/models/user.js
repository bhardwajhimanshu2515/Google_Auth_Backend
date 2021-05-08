const mongoose = require('mongoose');

const Schema = mongoose.Schema;


const userSchema = new Schema({
    name: { type: String},
    email: { type: String, required: true},
    password: { type: String, required: true, minlength: 6 },
    isActive: {type: Boolean, default: true}    
});

module.exports = mongoose.model('User', userSchema);