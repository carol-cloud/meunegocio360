// Relógio injetável: único ponto que lê a hora do sistema (RF-BE-001, "clock injetado").
export const relogioDoSistema = Object.freeze({
  now: () => new Date(),
});
