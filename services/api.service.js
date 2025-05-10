import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const posterUrl = process.env.POSTER_URL;
const orderUrl = process.env.BACKEND_URL;

class ApiService {
  async createIncomingOrder(data) {
    try {
      const response = await axios.post(
        `${posterUrl}/api/incomingOrders.createIncomingOrder?token=${process.env.PAST}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "createIncomingOrder error:",
        error?.response?.data || error.message
      );
      throw error;
    }
  }
  async getPosterData(url,params) {
    try {
      const response = await axios.get(
        `${posterUrl}/api/${url}?token=${process.env.PAST}${params}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error(
        "createIncomingOrder error:",
        error?.response?.data || error.message
      );
      throw error;
    }
  }
  async createAbduganiOrder(data) {
    try {
      const response = await axios.post(`${orderUrl}/add_order`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      console.error(
        "createAbduganiOrder error:",
        error?.response?.data || error.message
      );
      throw error;
    }
  }
}

export default new ApiService();
