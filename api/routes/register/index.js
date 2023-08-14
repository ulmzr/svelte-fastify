"use strict";

const cwd = process.cwd();
const { join } = require("node:path");
const { cleanRequest } = require(join(cwd, "api/library"));

module.exports = async function (fastify, opts) {
   fastify.post("/", async function (request, reply) {
      // Default variable
      let sukses = true;
      let pesan = "Sukses!";
      let { username, password, email } = request.body;

      // Bersihkan username dari karakter non-alpha-numeric + .~!@#$% ;
      // Jadikan username + email huruf kecil
      username = cleanRequest(username).toLowerCase();
      password = cleanRequest(password);
      email = cleanRequest(email).toLowerCase();

      // Check validasi request
      let isValidRequest = username !== "" && password !== "" && email !== "";
      isValidRequest = isValidRequest && email.includes("@"); // ToDo: search fungsi utk valid email

      if (!isValidRequest) {
         // Jika tidak valid:
         sukses = false;
         // Info user tentang kesalahan yg terjadi
         if (username === "" || password === "" || email === "") {
            pesan = "Pastikan semua field form sudah diisi!";
         }
         /*
         if (username === "" && password === "") { // 1
            pesan = "Pastikan username & password telah diisi!";
         } else if (username === "" && email === "") { // 2
            pesan = "Pastikan username & email telah diisi!";
         } else if (email === "" && password === "") { //3
            pesan = "Pastikan email & password telah diisi!";
         } else if (username === "") { // 
            pesan = "Pastikan username diisi dengan benar!";
         } else if (password === "") { //
            pesan = "Pastikan password diisi dengan benar!";
         } else if (!email.includes("@")) { //
            pesan = "Alamat email yang dimasukkan tidak valid!";
         } else {
            pesan =
               "Kesalahan lain yg tidak terdefenisi. Silakan kontak administrator!.";
         }
         */
      } else {
         // Pre-proccess
         const passwordHashed = await fastify.bcrypt.hash(password);
         const sql = `INSERT INTO users (username, password, email) values(?, ?, ?)`;
         let connection;

         // Insert data ke DB
         try {
            connection = await fastify.mysql.getConnection(); // 1 ECONNREFUSED
            await connection.query(sql, [username, passwordHashed, email]); // 2
            connection.release(); // 3
         } catch (error) {
            // Error handling jika terjadi kesalahan proses
            sukses = false;
            if (error.code === "ECONNREFUSED") {
               pesan = "Koneksi ke DB gagal!.";
            } else if (error.code === "ER_DUP_ENTRY") {
               // Duplikasi data
               pesan = "Username sudah ada!";
            } else {
               // Kesalahan yg blm terdefenisi
               pesan = error;
            }
         }
      }

      reply.send({
         sukses,
         pesan,
      });
   });
};
