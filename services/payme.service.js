import { default as mongoose } from "mongoose";
import TransactionError from "../errors/transaction.error.js";
import {
  PaymeError,
  PaymeData,
  TransactionState,
} from "../enum/transaction.enum.js";
import transactionModel from "../models/transaction.model.js";
import apiService from "../services/api.service.js";
import axios from "axios";
class PaymeService {
  async checkPerformTransaction(params, id) {
    let { amount } = params;
    const { account } = params;
    const order = await transactionModel.findOne({
      _id: account.order_id,
      provider: "payme",
    });

    if (!order) {
      throw new TransactionError(PaymeError.TransactionNotFound, id);
    }

    if (order?.amount !== amount) {
      throw new TransactionError(PaymeError.InvalidAmount, id);
    }
  }

  async checkTransaction(params, id) {
    const transaction = await transactionModel.findOne({
      transaction_id: params.id,
    });
    if (!transaction) {
      throw new TransactionError(PaymeError.TransactionNotFound, id);
    }

    console.log({ transaction });

    return {
      create_time: transaction.create_time,
      perform_time: transaction.perform_time,
      cancel_time: transaction.cancel_time,
      transaction: transaction.transaction_id,
      state: transaction.status,
      reason: transaction.reason == 0 ? null : transaction.reason,
    };
  }

  async createTransaction(params, id) {
    let { account, time, amount } = params;
    const currentTime = Date.now();
    amount = Math.floor(amount / 100);

    await this.checkPerformTransaction(params, id);

    let transaction = await transactionModel.findOne({
      transaction_id: params.id,
    });
    if (transaction) {
      if (transaction.status !== TransactionState.Pending) {
        throw new TransactionError(PaymeError.CantDoOperation, id);
      }

      const expirationTime =
        (currentTime - transaction.create_time) / 60000 < 12;
      if (!expirationTime) {
        await transactionModel.findOneAndUpdate(
          { transaction_id: params.id },
          { status: TransactionState.PendingCanceled, reason: 4 }
        );
        throw new TransactionError(PaymeError.CantDoOperation, id);
      }

      return {
        create_time: transaction?.create_time,
        transaction: params?.id,
        state: TransactionState.Pending,
      };
    }

    transaction = await transactionModel.findOne({
      _id: account.order_id,
      provider: "payme",
    });
    if (transaction) {
      if (transaction.status === TransactionState.Paid)
        throw new TransactionError(PaymeError.AlreadyDone, id);
      if (transaction.status === TransactionState.Pending)
        throw new TransactionError(PaymeError.Pending, id);
    }

    await transactionModel.findOneAndUpdate(
      { _id: account?.order_id },
      {
        transaction_id: params.id,
        status: TransactionState.Pending,
        create_time: time,
      }
    );
    return {
      transaction: params.id,
      state: TransactionState.Pending,
      create_time: time,
    };
  }

  async performTransaction(params, id) {
    const currentTime = Date.now();

    const transaction = await transactionModel.findOne({
      transaction_id: params.id,
    });
    if (!transaction) {
      throw new TransactionError(PaymeError.TransactionNotFound, id);
    }
    if (transaction.status !== TransactionState.Pending) {
      if (transaction.status !== TransactionState.Paid) {
        throw new TransactionError(PaymeError.CantDoOperation, id);
      }
      return {
        perform_time: transaction.perform_time,
        transaction: transaction.transaction_id,
        state: TransactionState.Paid,
      };
    }
    const expirationTime = (currentTime - transaction.create_time) / 60000 < 12;
    if (!expirationTime) {
      await transactionModel.findOneAndUpdate(
        { transaction_id: params.id },
        {
          status: TransactionState.PendingCanceled,
          reason: 4,
          cancel_time: currentTime,
        }
      );
      throw new TransactionError(PaymeError.CantDoOperation, id);
    }
    const { orderDetails, amount } = transaction;
    const { comment } = orderDetails;
    const { service_mode, ...abganiData } = orderDetails;

    let res;
    switch (service_mode) {
      //zavideniya
      case 1:
        const { service, spot_name, ...spotData } = orderDetails;
        const res = await apiService.createIncomingOrder(spotData);
        const { transaction_id } = res?.response;
        console.log("res", res);
        if (transaction_id) {
          const message = `
          📦 Новый заказ! №${transaction_id}
          🛒 Название филиал: ${spot_name}
          📞 Телефон: +998771244444
          💵 Сумма заказа: ${formatNumber(
            service == "waiter"
              ? Number(amount + (amount * 10) / 100)
              : Number(amount)
          )} сум
          💳 Метод оплаты:Карта (Оплачено)
          🛍 Тип заказа: Заведения
          ✏️ Комментарий: ${comment}`.trim();

          await axios.get(
            `https://api.telegram.org/bot7051935328:AAFJxJAVsRTPxgj3rrHWty1pEUlMkBgg9_o/sendMessage?chat_id=-1002211902296&text=${encodeURIComponent(
              message
            )}`
          );
        }
        break;
      //delivery
      case 2:
        res = await apiService.createAbduganiOrder(abganiData);
        break;
      //pickup
      case 3:
        res = await apiService.createAbduganiOrder(abganiData);
        break;
      default:
        break;
    }

    await transactionModel.findOneAndUpdate(
      { transaction_id: params.id },
      {
        status: TransactionState.Paid,
        perform_time: currentTime,
        order_id: res?.order_id ? res?.order_id : "",
      }
    );

    return {
      perform_time: currentTime,
      transaction: transaction.transaction_id,
      state: TransactionState.Paid,
    };
  }

  async cancelTransaction(params, id) {
    const transaction = await transactionModel.findOne({
      transaction_id: params.id,
    });

    if (!transaction) {
      throw new TransactionError(PaymeError.TransactionNotFound, id);
    }

    const currentTime = Date.now();

    if (transaction.status > 0) {
      await transactionModel.findOneAndUpdate(
        { transaction_id: params.id },
        {
          status: -Math.abs(transaction.status),
          reason: params.reason,
          cancel_time: currentTime,
        }
      );
    }

    return {
      cancel_time: transaction.cancel_time || currentTime,
      transaction: transaction.transaction_id,
      state: -Math.abs(transaction.status),
    };
  }

  async getStatement(params) {
    const { from, to } = params;
    const transactions = await transactionModel.find({
      create_time: { $gte: from, $lte: to },
      provider: "payme",
    });

    return transactions.map((transaction) => ({
      transaction_id: transaction.transaction_id,
      time: transaction.create_time,
      amount: transaction.amount,
      account: {
        order_id: transaction._id,
      },
      create_time: transaction.create_time,
      perform_time: transaction.perform_time,
      cancel_time: transaction.cancel_time,
      transaction: transaction.transaction_id,
      state: transaction.status,
      reason: transaction.reason,
    }));
  }
}

export default new PaymeService();
