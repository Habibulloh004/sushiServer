import transactionModel from "../models/transaction.model.js";

class TransactionController {
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const transaction = await transactionModel.findOne({ _id: id });
      if (!transaction) {
        return res.status(404).send("Transaction not found");
      }
      res.send(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).send(`Error: ${error.message}`);
    }
  }
}

export default new TransactionController();
