"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HAS_IS_ACTIVE = exports.HAS_COMPANY_ID = exports.IS_ACTIVE_COLUMN = exports.COMPANY_ID_COLUMN = exports.IS_TEST_DATA_COLUMN = exports.ALL_TABLE_NAMES = void 0;
exports.buildColumnMap = buildColumnMap;
exports.getTableNamesWithField = getTableNamesWithField;
const client_1 = require("@prisma/client");
function buildColumnMap(fieldName) {
    const map = new Map();
    for (const model of client_1.Prisma.dmmf.datamodel.models) {
        const field = model.fields.find((f) => f.name === fieldName);
        if (field)
            map.set(model.dbName || model.name, field.dbName || field.name);
    }
    return map;
}
function getTableNamesWithField(fieldName, excludeModelNames = []) {
    return client_1.Prisma.dmmf.datamodel.models
        .filter((m) => m.fields.some((f) => f.name === fieldName) && !excludeModelNames.includes(m.name))
        .map((m) => m.dbName || m.name);
}
exports.ALL_TABLE_NAMES = new Set(client_1.Prisma.dmmf.datamodel.models.map((m) => m.dbName || m.name));
exports.IS_TEST_DATA_COLUMN = buildColumnMap('isTestData');
exports.COMPANY_ID_COLUMN = buildColumnMap('companyId');
exports.IS_ACTIVE_COLUMN = buildColumnMap('isActive');
exports.HAS_COMPANY_ID = new Set(getTableNamesWithField('companyId'));
exports.HAS_IS_ACTIVE = new Set(getTableNamesWithField('isActive'));
//# sourceMappingURL=schema-columns.util.js.map