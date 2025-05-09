import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const transactionSchema = new Schema(
  {
    transaction_id: { type: String },
    userId: { type: String, required: false, default: null },
    orderDetails: { type: Object },
    status: { type: Number },
    amount: { type: Number },
    create_time: { type: Number, default: 0 },
    perform_time: { type: Number, default: 0 },
    cancel_time: { type: Number, default: 0 },
    reason: { type: Number, default: null },
    provider: { type: String },
    prepare_id: { type: String },
  },
  { timestamps: true }
);

export default model('Transaction', transactionSchema);
