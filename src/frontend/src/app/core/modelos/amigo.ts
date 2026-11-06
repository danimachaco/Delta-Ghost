/**
 * Modelos de los amigos. Coinciden con los DTO del backend
 * (AmistadResponse.java y SolicitudesResponse.java, PS-56).
 */
import { Usuario } from './usuario';

/** Estado de una amistad: solicitud enviada o amistad confirmada */
export type EstadoAmistad = 'PENDIENTE' | 'ACEPTADA';

/** Una amistad o solicitud, vista desde el usuario que ha iniciado sesión */
export interface Amistad {
  /** Id de la amistad (el que se usa para aceptar la solicitud) */
  id: string;
  /** La OTRA persona: tu amigo, quien te envió la solicitud o a quien se la enviaste */
  usuario: Usuario;
  estado: EstadoAmistad;
  /** Fecha ISO de la solicitud, o de cuando se aceptó si ya sois amigos */
  fecha: string;
}

/** Solicitudes pendientes → GET /api/amigos/solicitudes */
export interface Solicitudes {
  /** Las que te han enviado y puedes aceptar */
  recibidas: Amistad[];
  /** Las que has enviado y esperan respuesta */
  enviadas: Amistad[];
}
