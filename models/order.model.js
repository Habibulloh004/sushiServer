import mongoose from "mongoose";

const OrderSchema = mongoose.Schema({
  order_id: {
    type: String,
    unique: true
  },
  courier_id: {
    type: Number,
  },
  orderData: {
    type: Object,
  },
  products: {
    type: Array,
  },
  status: {
    type: String
  }
});

export const Order = mongoose.model("Order", OrderSchema);
