import { Schema, model, models } from "mongoose";
import { RolUsuario } from "@/app/types/usuario";

const UsuarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    correo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    contraseña: { type: String, select: false },
    rol: {
      type: String,
      enum: Object.values(RolUsuario),
      default: RolUsuario.ESTUDIANTE,
    },
    firebaseUid: { type: String, trim: true, sparse: true, index: true },
    creadoEn: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const UsuarioModel =
  models.Usuario || model("Usuario", UsuarioSchema);
