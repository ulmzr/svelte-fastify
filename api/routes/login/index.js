"use strict";

const { join } = require("node:path");
const cwd = process.cwd();
const { cleanRequest } = require(join(cwd, "api/library"));

module.exports = async function (fastify, opts) {
   fastify.post("/", async function (request, reply) {
      // Default variable
      let sukses = true;
      let pesan = "Otentikasi berhasil!";
      let token;
      let group;
      let dbData;
      let { username, password } = request.body;

      // Bersihkan username dari karakter non-alpha-numeric + .~!@#$% ;
      // Jadikan username huruf kecil
      username = cleanRequest(username).toLowerCase();
      password = cleanRequest(password);

      // Cek validasi request
      let isValidRequest = username !== "" && password !== "";

      if (!isValidRequest) {
         // Jika tidak valid:
         sukses = false;
         // Info user tentang kesalahan yg terjadi
         if (username === "" || password === "") {
            pesan = "Pastikan semua field form sudah diisi!";
         }
      } else {
         // Pre-proccess
         const sql = `SELECT * from users WHERE username = ?`;
         let connection;

         // Buka komunikasi dgn DB

         try {
            connection = await fastify.mysql.getConnection();
            const [rows, fields] = await connection.query(sql, [username]);
            dbData = rows[0];
            connection.release();
         } catch (error) {
            // Error handling jika terjadi kesalahan proses
            sukses = false;
            pesan = err;
            if (err.code === "ECONNREFUSED") {
               pesan = "Koneksi ke DB gagal!.";
            } else {
               // Kesalahan yg blm terdefenisi
               pesan = error;
            }
         }

         if (!dbData) {
            sukses = false;
            pesan = "Username tidak ditemukan. Anda belum terdaftar!";
         }

         if (sukses) {
            // Bandingkan password yg dientry User dgn DB.
            if (await fastify.bcrypt.compare(password, dbData.password)) {
               // Jika cocok
               // Cek status aktif
               if (dbData.active) {
                  // Aktif
                  group = dbData.group;
                  token = fastify.jwt.sign({
                     username,
                     group,
                  });
               } else {
                  // Jika belum aktif.
                  sukses = false;
                  pesan = "Terotentikasi tapi belum aktif. Kontak administrator untuk status aktif!.";
               }
            } else {
               // Jika tdk cocok
               sukses = false;
               pesan = "Password tidak cocok!";
            }
         }
      }

      reply.send({
         sukses, // sukses: sukses
         pesan,
         group,
         token,
         copyright: fastify.copyright,
      });
   });
};
