package com.rutafantasma.backend.dto;

import java.util.List;

/**
 * Solicitudes de amistad pendientes del usuario: GET /api/amigos/solicitudes
 * @param recibidas las que te han enviado y puedes aceptar
 * @param enviadas  las que has enviado y esperan respuesta
 */
public record SolicitudesResponse(List<AmistadResponse> recibidas, List<AmistadResponse> enviadas) {
}
