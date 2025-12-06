/**
 * Soft Delete Utility Functions
 * Provides consistent soft delete filtering and operations across the application
 */

/**
 * Creates a where clause that excludes soft-deleted records
 * @param {Object} additionalWhere - Additional where conditions
 * @returns {Object} Where clause with deletedAt filter
 */
function excludeDeleted(additionalWhere = {}) {
  return {
    ...additionalWhere,
    deletedAt: null,
  };
}

/**
 * Creates a soft delete update (sets deletedAt to current timestamp)
 * @returns {Object} Update data for soft delete
 */
function softDeleteUpdate() {
  return {
    deletedAt: new Date(),
  };
}

/**
 * Restores a soft-deleted record (sets deletedAt to null)
 * @returns {Object} Update data for restore
 */
function restoreUpdate() {
  return {
    deletedAt: null,
  };
}

/**
 * Checks if a record is soft-deleted
 * @param {Object} record - The database record
 * @returns {boolean} True if record is soft-deleted
 */
function isDeleted(record) {
  return record && record.deletedAt !== null;
}

module.exports = {
  excludeDeleted,
  softDeleteUpdate,
  restoreUpdate,
  isDeleted,
};

