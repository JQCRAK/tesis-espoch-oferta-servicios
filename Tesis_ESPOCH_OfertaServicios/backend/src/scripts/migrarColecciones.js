// backend/src/scripts/migrarColecciones.js
//
// Migración de colecciones seleccionadas del MongoDB Atlas VIEJO al NUEVO.
//
// Colecciones a migrar: preguntas, encuestas, eventos, noticias.
// Estas son las que contienen configuración de encuestas y contenido publicado
// por el admin — datos que perderíamos si arrancamos limpio.
//
// Cómo usarlo (una sola vez, después de cambiar de cuenta Atlas):
//   1) En tu .env, agrega la línea:
//        MONGO_URI_ORIGEN=<connection string del Atlas VIEJO>
//      (MONGO_URI ya apunta al Atlas nuevo, no lo toques)
//   2) Ejecuta:
//        docker compose exec backend node src/scripts/migrarColecciones.js
//   3) Revisa el reporte que sale por consola.
//   4) Cuando confirmes que todo migró, BORRA la línea MONGO_URI_ORIGEN de tu .env.
//
// Se preserva el _id original de cada documento para NO romper referencias
// entre colecciones (ej: pregunta.encuesta apunta al _id de una encuesta).
// Si un documento ya existe en el destino, se conserva el existente y no se
// sobreescribe — así el script es idempotente (seguro de correr varias veces).

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { MongoClient } = require('mongodb');

const COLECCIONES = [
    'preguntas',
    'encuestas',
    'eventos',
    'noticias',
    'graduados',
    'respuestaencuestas',
    'respuestaempleadors',
];

async function migrar() {
    const uriOrigen  = process.env.MONGO_URI_ORIGEN;
    const uriDestino = process.env.MONGO_URI;

    if (!uriOrigen) {
        console.error('❌ MONGO_URI_ORIGEN no está definido en el .env');
        console.error('   Agrega la línea MONGO_URI_ORIGEN=<uri del Atlas viejo> y vuelve a correr.');
        process.exit(1);
    }
    if (!uriDestino) {
        console.error('❌ MONGO_URI no está definido en el .env');
        process.exit(1);
    }
    if (uriOrigen === uriDestino) {
        console.error('❌ MONGO_URI_ORIGEN y MONGO_URI son iguales — apuntan a la misma BD.');
        process.exit(1);
    }

    console.log('══════════════════════════════════════════════════════');
    console.log('  MIGRACIÓN DE COLECCIONES  —  Portal de Graduados');
    console.log('══════════════════════════════════════════════════════\n');

    console.log('🔌 Conectando al Atlas ORIGEN (viejo)...');
    const clientOrigen = new MongoClient(uriOrigen, { serverSelectionTimeoutMS: 15000 });
    await clientOrigen.connect();
    const dbOrigen = clientOrigen.db();
    console.log(`   ✅ Conectado — DB: "${dbOrigen.databaseName}"`);

    console.log('🔌 Conectando al Atlas DESTINO (nuevo)...');
    const clientDestino = new MongoClient(uriDestino, { serverSelectionTimeoutMS: 15000 });
    await clientDestino.connect();
    const dbDestino = clientDestino.db();
    console.log(`   ✅ Conectado — DB: "${dbDestino.databaseName}"\n`);

    const reporte = [];

    for (const nombre of COLECCIONES) {
        console.log(`──────────────────────────────────────────────`);
        console.log(`📦 Migrando colección: "${nombre}"`);

        const colOrigen  = dbOrigen.collection(nombre);
        const colDestino = dbDestino.collection(nombre);

        const docs = await colOrigen.find({}).toArray();
        console.log(`   📄 Encontrados en origen: ${docs.length} documentos`);

        if (docs.length === 0) {
            console.log(`   ⏭️  Nada que migrar — salteando.\n`);
            reporte.push({ coleccion: nombre, encontrados: 0, insertados: 0, existentes: 0, errores: 0 });
            continue;
        }

        let insertados = 0;
        let existentes = 0;
        let errores    = 0;

        for (const doc of docs) {
            try {
                await colDestino.insertOne(doc);
                insertados++;
            } catch (e) {
                if (e.code === 11000) {
                    // Ya existe (duplicado de _id o índice único) — lo conservamos como está
                    existentes++;
                } else {
                    console.error(`      ❌ Error en doc ${doc._id}:`, e.message);
                    errores++;
                }
            }
        }

        console.log(`   ✅ Insertados: ${insertados}`);
        if (existentes > 0) console.log(`   ⚠️  Ya existían (no sobreescritos): ${existentes}`);
        if (errores    > 0) console.log(`   ❌ Con error: ${errores}`);
        console.log('');

        reporte.push({ coleccion: nombre, encontrados: docs.length, insertados, existentes, errores });
    }

    console.log('══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('══════════════════════════════════════════════════════');
    console.table(reporte);

    const totalInsertados = reporte.reduce((s, r) => s + r.insertados, 0);
    const totalErrores    = reporte.reduce((s, r) => s + r.errores, 0);
    console.log(`\n   Total insertados: ${totalInsertados}`);
    console.log(`   Total errores:    ${totalErrores}`);
    console.log('');
    if (totalErrores === 0) {
        console.log('✔️  MIGRACIÓN EXITOSA.');
        console.log('   ➤ Verifica en la app que las encuestas, preguntas, eventos y noticias estén.');
        console.log('   ➤ Cuando confirmes, BORRA la línea MONGO_URI_ORIGEN de tu .env para dejarlo limpio.\n');
    } else {
        console.log('⚠️  Migración con errores. Revisa arriba y ejecuta de nuevo si es necesario.\n');
    }

    await clientOrigen.close();
    await clientDestino.close();
}

migrar().catch(err => {
    console.error('\n❌ Error crítico:', err.message);
    console.error(err);
    process.exit(1);
});
