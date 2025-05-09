import transactionModel from "../models/transaction.model.js";

class TransactionController {
  async getById(req, res, next) {
    try {
      const { id } = req.param;
      const transaction = await transactionModel.findOne({ _id: id });
      res.send(transaction);
    } catch (error) {
      res.send(`not found transaction ${error}`)
    }
  }
}

export default new TransactionController();
