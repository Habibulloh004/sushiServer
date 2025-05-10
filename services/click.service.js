import transactionModel from "../models/transaction.model.js";
import clickCheckToken from "../utils/click-check.js";
import {
  ClickError,
  ClickAction,
  TransactionState,
} from "../enum/transaction.enum.js";
import apiService from "../services/api.service.js";
import axios from "axios";

class ClickService {
  async prepare(data) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
      sign_string,
    } = data;

    const order = await transactionModel.findById(merchant_trans_id);

    if (!order) {
      return {
        error: ClickError.TransactionNotFound,
        error_note: "Transaction not found",
      };
    }
    const orderId = order._id;
    const userId = order.userId;

    const signatureData = {
      click_trans_id,
      service_id,
      orderId,
      amount,
      action,
      sign_time,
    };

    const checkSignature = clickCheckToken(signatureData, sign_string);
    if (!checkSignature) {
      return { error: ClickError.SignFailed, error_note: "Invalid sign" };
    }

    if (parseInt(action) !== ClickAction.Prepare) {
      return {
        error: ClickError.ActionNotFound,
        error_note: "Action not found",
      };
    }

    const isAlreadyPaid = await transactionModel.findOne({
      userId: userId,
      status: TransactionState.Paid,
      provider: "click",
    });

    if (isAlreadyPaid) {
      return { error: ClickError.AlreadyPaid, error_note: "Already paid" };
    }

    if (parseInt(amount) !== order.amount) {
      return {
        error: ClickError.InvalidAmount,
        error_note: "Incorrect parameter amount",
      };
    }

    const transaction = await transactionModel.findOne({ id: click_trans_id });

    if (transaction && transaction.status === TransactionState.Canceled) {
      return {
        error: ClickError.TransactionCanceled,
        error_note: "Transaction canceled",
      };
    }

    const time = new Date().getTime();

    await transactionModel.findOneAndUpdate(
      { _id: orderId },
      {
        transaction_id: click_trans_id,
        status: TransactionState.Pending,
        perform_time: time,
      }
    );

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_prepare_id: time,
      error: ClickError.Success,
      error_note: "Success",
    };
  }

  async complete(data) {
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
      sign_string,
      error,
    } = data;

    const order = await transactionModel.findById(merchant_trans_id);

    const userId = order.userId;
    const orderId = order._id;

    const signatureData = {
      click_trans_id,
      service_id,
      orderId,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
    };

    const checkSignature = clickCheckToken(signatureData, sign_string);

    if (!checkSignature) {
      return { error: ClickError.SignFailed, error_note: "Invalid sign" };
    }

    if (parseInt(action) !== ClickAction.Complete) {
      return {
        error: ClickError.ActionNotFound,
        error_note: "Action not found",
      };
    }

    const isPrepared = await transactionModel.findOne({
      prepare_id: merchant_prepare_id,
      provider: "click",
    });
    if (!isPrepared) {
      return {
        error: ClickError.TransactionNotFound,
        error_note: "Transaction not found",
      };
    }

    const isAlreadyPaid = await transactionModel.findOne({
      userId,
      status: TransactionState.Paid,
      provider: "click",
    });
    if (isAlreadyPaid) {
      return {
        error: ClickError.AlreadyPaid,
        error_note: "Already paid for course",
      };
    }

    if (parseInt(amount) !== order.amount) {
      return {
        error: ClickError.InvalidAmount,
        error_note: "Incorrect parameter amount",
      };
    }

    const transaction = await transactionModel.findOne({ _id: orderId });
    if (transaction && transaction.status === TransactionState.Canceled) {
      return {
        error: ClickError.TransactionCanceled,
        error_note: "Transaction canceled",
      };
    }

    const time = new Date().getTime();

    if (error < 0) {
      await transactionModel.findOneAndUpdate(
        { _id: orderId },
        { status: TransactionState.Canceled, cancel_time: time }
      );
      return {
        error: ClickError.TransactionNotFound,
        error_note: "Transaction not found",
      };
    }
    const { orderDetails } = transaction;
    const { service_mode, comment } = orderDetails;
    let res;
    switch (service_mode) {
      //zavideniya
      case 1:
        const { service, spot_name, ...spotData } = orderDetails;
        res = await apiService.createIncomingOrder(spotData);
        const { transaction_id } = res?.response;
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
        const { service_mode, ...abganiData } = orderDetails;
        res = await apiService.createAbduganiOrder(abganiData);
        break;
      //pickup
      case 3:
        res = await apiService.createAbduganiOrder(abganiData);
        break;
      default:
        break;
    }
    console.log("res", res);

    await transactionModel.findOneAndUpdate(
      { _id: orderId },
      {
        status: TransactionState.Paid,
        perform_time: time,
        order_id: res?.order_id ? res?.order_id : "",
      }
    );

    return {
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: time,
      error: ClickError.Success,
      error_note: "Success",
    };
  }
}

export default new ClickService();
