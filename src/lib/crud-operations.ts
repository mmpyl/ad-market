import { createPostgrestClient } from "./postgrest";
import { validateEnv } from "./api-utils";

// ==================== Types ====================

interface FindManyParams {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    direction: "asc" | "desc";
  };
  select?: string; // Campos a seleccionar (default: "*")
}

interface PaginationResult<T> {
  data: T[];
  total?: number;
  limit?: number;
  offset?: number;
}

type Filters = Record<string, any>;
type CreateData = Record<string, any>;
type UpdateData = Record<string, any>;

// ==================== CRUD Operations Class ====================

/**
 * Clase utilitaria para operaciones CRUD comunes con PostgREST
 * 
 * @example
 * const usersCrud = new CrudOperations("users", adminToken);
 * const users = await usersCrud.findMany({ role: "vendedor" }, { limit: 10 });
 */
export default class CrudOperations {
  constructor(
    private tableName: string,
    private token?: string
  ) {
    if (!tableName) {
      throw new Error('Table name is required');
    }
  }

  /**
   * Obtiene el cliente de Postgrest con el token actual
   */
  private get client() {
    return createPostgrestClient(this.token);
  }

  /**
   * Obtiene múltiples registros con filtrado, ordenamiento y paginación opcionales
   * 
   * @param filters - Objeto con filtros de igualdad (key: value)
   * @param params - Parámetros de paginación y ordenamiento
   * @returns Array de registros
   * 
   * @example
   * const users = await crud.findMany(
   *   { active: true, role: "vendedor" },
   *   { limit: 10, offset: 0, orderBy: { column: "created_at", direction: "desc" } }
   * );
   */
  async findMany<T = any>(
    filters?: Filters,
    params?: FindManyParams
  ): Promise<T[]> {
    validateEnv();

    const { limit, offset, orderBy, select = "*" } = params || {};

    let query = this.client
      .from(this.tableName)
      .select(select);

    // Aplicar ordenamiento
    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.direction === "asc",
      });
    }

    // Aplicar filtros
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Aplicar paginación
    if (limit !== undefined && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to fetch ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return (data || []) as T[];
  }

  /**
   * Obtiene múltiples registros con información de paginación total
   * 
   * @param filters - Objeto con filtros de igualdad
   * @param params - Parámetros de paginación y ordenamiento
   * @returns Objeto con data, total, limit y offset
   */
  async findManyWithCount<T = any>(
    filters?: Filters,
    params?: FindManyParams
  ): Promise<PaginationResult<T>> {
    validateEnv();

    const { limit, offset, orderBy, select = "*" } = params || {};

    let query = this.client
      .from(this.tableName)
      .select(select, { count: "exact" });

    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.direction === "asc",
      });
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    if (limit !== undefined && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(
        `Failed to fetch ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return {
      data: (data || []) as T[],
      total: count ?? undefined,
      limit,
      offset,
    };
  }

  /**
   * Obtiene un solo registro por su ID
   * 
   * @param id - ID del registro
   * @returns Registro encontrado o null si no existe
   * 
   * @example
   * const user = await crud.findById(123);
   * if (user) {
   *   console.log(user.name);
   * }
   */
  async findById<T = any>(id: string | number): Promise<T | null> {
    validateEnv();

    const { data, error } = await this.client
      .from(this.tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      // PGRST116 = No rows found
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(
        `Failed to fetch ${this.tableName} by id: ${error.message} (code: ${error.code})`
      );
    }

    return data as T;
  }

  /**
   * Busca un registro que cumpla con los filtros especificados
   * 
   * @param filters - Objeto con filtros de igualdad
   * @returns Primer registro encontrado o null
   */
  async findOne<T = any>(filters: Filters): Promise<T | null> {
    validateEnv();

    let query = this.client
      .from(this.tableName)
      .select("*");

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(
        `Failed to find one ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return data as T;
  }

  /**
   * Crea un nuevo registro en la tabla
   * 
   * @param data - Datos del nuevo registro
   * @returns Registro creado
   * 
   * @example
   * const newUser = await crud.create({
   *   name: "John Doe",
   *   email: "john@example.com",
   *   role: "vendedor"
   * });
   */
  async create<T = any>(data: CreateData): Promise<T> {
    validateEnv();

    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert([data])
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to create ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return result as T;
  }

  /**
   * Crea múltiples registros en una sola operación
   * 
   * @param dataArray - Array de objetos con los datos
   * @returns Array de registros creados
   */
  async createMany<T = any>(dataArray: CreateData[]): Promise<T[]> {
    validateEnv();

    if (!dataArray.length) {
      return [];
    }

    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert(dataArray)
      .select();

    if (error) {
      throw new Error(
        `Failed to create multiple ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return (result || []) as T[];
  }

  /**
   * Actualiza un registro existente por ID
   * 
   * @param id - ID del registro a actualizar
   * @param data - Datos a actualizar
   * @returns Registro actualizado
   * 
   * @example
   * const updated = await crud.update(123, { name: "Jane Doe" });
   */
  async update<T = any>(
    id: string | number,
    data: UpdateData
  ): Promise<T> {
    validateEnv();

    const { data: result, error } = await this.client
      .from(this.tableName)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(
        `Failed to update ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return result as T;
  }

  /**
   * Actualiza múltiples registros que cumplan con los filtros
   * 
   * @param filters - Filtros para identificar registros a actualizar
   * @param data - Datos a actualizar
   * @returns Array de registros actualizados
   */
  async updateMany<T = any>(
    filters: Filters,
    data: UpdateData
  ): Promise<T[]> {
    validateEnv();

    let query = this.client
      .from(this.tableName)
      .update(data);

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { data: result, error } = await query.select();

    if (error) {
      throw new Error(
        `Failed to update multiple ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return (result || []) as T[];
  }

  /**
   * Elimina un registro por ID
   * 
   * @param id - ID del registro a eliminar
   * @returns Objeto con el ID eliminado
   * 
   * @example
   * await crud.delete(123);
   */
  async delete(id: string | number): Promise<{ id: string | number }> {
    validateEnv();

    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(
        `Failed to delete ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return { id };
  }

  /**
   * Elimina múltiples registros que cumplan con los filtros
   * 
   * @param filters - Filtros para identificar registros a eliminar
   * @returns Objeto con count de registros eliminados
   */
  async deleteMany(filters: Filters): Promise<{ count: number }> {
    validateEnv();

    let query = this.client
      .from(this.tableName)
      .delete();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    const { error, count } = await query;

    if (error) {
      throw new Error(
        `Failed to delete multiple ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return { count: count ?? 0 };
  }

  /**
   * Cuenta el número de registros que cumplen con los filtros
   * 
   * @param filters - Filtros opcionales
   * @returns Número de registros
   */
  async count(filters?: Filters): Promise<number> {
    validateEnv();

    let query = this.client
      .from(this.tableName)
      .select("*", { count: "exact", head: true });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    const { error, count } = await query;

    if (error) {
      throw new Error(
        `Failed to count ${this.tableName}: ${error.message} (code: ${error.code})`
      );
    }

    return count ?? 0;
  }
}

// ==================== Exports ====================

export type {
  FindManyParams,
  PaginationResult,
  Filters,
  CreateData,
  UpdateData,
};
