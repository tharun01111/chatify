import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingImage: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
    } catch (error) {
      console.log("Error in authCheck: " + error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {
    set({ isSigningUp: true });

    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });

      toast.success("Account created successfully");
    } catch (error) {
      console.log("" + error);
      toast.error(
        error.response?.data?.message || error.message || "Signup failed",
      );
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data) => {
    set({ isLoggingIn: true });

    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });

      toast.success("Logged In successfully");
    } catch (error) {
      console.log("" + error);
      toast.error(
        error.response?.data?.message || error.message || "Login failed",
      );
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("auth/logout");
      toast.success("Logout successfull");
      set({ authUser: null });
    } catch (error) {
      console.log(error);
      toast.error("Error logging out");
    }
  },
updateProfile: async (data) => {
  set({ isUpdatingImage: true });  

  try {
    const res = await axiosInstance.put("/auth/update-profile", data);
    set({ authUser: res.data });
    toast.success("Profile updated successfully");
  } catch (error) {
    console.log("Error while photo upload: " + error);
    toast.error(error.response?.data?.message || "Image upload failed");
  } finally {
    set({ isUpdatingImage: false });
  }
},
}));
