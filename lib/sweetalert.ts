import Swal from "sweetalert2";

export const confirmAlert = async (text: string, title = "Konfirmasi") => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Ya",
    cancelButtonText: "Batal",
  });
  return result.isConfirmed;
};

export const errorAlert = (text: string, title = "Peringatan") => {
  return Swal.fire({
    title,
    text,
    icon: "error",
  });
};

export const successAlert = (text: string, title = "Berhasil") => {
  return Swal.fire({
    title,
    text,
    icon: "success",
  });
};
