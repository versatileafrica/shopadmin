var express = require("express");
var mysql = require("mysql");
var cors = require("cors");
var bodyparser = require("body-parser");
var app = express();
const multer = require("multer");
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const fs = require("fs");
// const bcrypt = require('bcrypt');
const saltRounds = 10;

const jwt = require("jsonwebtoken");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

app.use(cors({ header: { "Access-Control-Allow-Origin": "*" } }));
app.use(express.json());
app.use(cookieParser());
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
//{origin: "http://localhost:8100"}

app.use(
  session({
    key: "userId",
    secret: "subscribe",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

app.listen("3004", () => {
  console.log("server is running....");
});

// mysql database connection
const db = mysql.createConnection({
  user: "benixags_vital14",
  host: "localhost",
  password: "fnW*,jE_%hXl",
  database: "benixags_shop",
});

// check db connection
db.connect((err) => {
  if (err) throw err;
  else {
    console.log("database connected ....");
  }
});

app.get("/", (req, res) => {
  res.json({ message: "OKAY" });
  console.log("server is running....");
});
//registration
app.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const code_parrain = req.body.code_parrain;
  const type = req.body.type;
  const email = req.body.emaill;
  let idmax = 0;
  if (type == "sellers") {
    db.query(
      "SELECT * FROM sellers WHERE username = ?",
      username,
      (err, result) => {
        // if(err){
        //   console.log(err);
        //   res.send({ err: err});

        // }
        //   res.send(result);
        if (result.length > 0) {
          res.json({
            regist: false,
            message: "Ce nom d'utilisateur existe d??j?? !",
          });
        } else {
          db.query(
            "SELECT * FROM sellers WHERE boutiqueName = ?",
            code_parrain,
            (err, result) => {
              if (result.length > 0) {
                res.json({
                  regist: false,
                  message: "Ce code de parrainage existe d??j?? !",
                });
              } else {
                bcrypt.hash(password, saltRounds, (err, hash) => {
                  if (err) {
                    console.log(err);
                  }

                  db.query(
                    "INSERT INTO sellers (username, password, boutiqueName, email) VALUES (?,?,?,?)",
                    [username, hash, code_parrain, email],
                    (err, result) => {
                      if (err) {
                        console.log(err);
                      } else {
                        //  res.send("Values Inserted");
                        db.query(
                          "SELECT  MAX(id) AS idm FROM sellers ",
                          (err, result) => {
                            if (err) {
                              console.log(err);
                            } else {
                              //res.send(result);
                              idmax = result[0].idm;
                              db.query(
                                "insert into caisse(id_boutique, caisse) values (?,?)",
                                [idmax, 0],
                                (err, result) => {
                                  if (!err) {
                                    res.send("success");
                                  } else {
                                    console.log(err);
                                  }
                                }
                              );
                            }
                          }
                        );
                      }
                    }
                  );
                });
              }
            }
          );
        }
      }
    );
  } else if (type == "clients") {
    db.query(
      "SELECT * FROM users WHERE username = ?",
      username,
      (err, result) => {
        // if(err){
        //   console.log(err);
        //   res.send({ err: err});

        // }
        //   res.send(result);
        if (result.length > 0) {
          res.json({
            regist: false,
            message: "Ce nom d'utilisateur existe d??j?? !",
          });
        } else {
          bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
              console.log(err);
            }

            db.query(
              "INSERT INTO users (username, password) VALUES (?,?)",
              [username, hash],
              (err, result) => {
                if (err) {
                  console.log(err);
                } else {
                  res.send("Values Inserted");
                }
              }
            );
          });
        }
      }
    );
  }
});
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const type = req.body.type;

  if (type == "sellers") {
    db.query(
      "SELECT * FROM sellers WHERE username = ?",
      username,
      (err, result) => {
        if (err) {
          //   console.log(err);
          res.send({ err: err });
        }
        //   res.send(result);
        if (result.length > 0) {
          bcrypt.compare(password, result[0].password, (error, response) => {
            if (response) {
              const id = result[0].id;
              const token = jwt.sign({ id }, "jwtSecret", {
                expiresIn: 6000,
              });
              req.session.user = result;

              // res.send(result);
              res.json({ auth: true, token: token, result: result });
            } else {
              // res.send({ message: "Mauvaise combinaison"})
              res.json({ auth: false, message: "Mauvaise combinaison" });
            }
          });
        } else {
          res.json({ auth: false, message: "L'utilisateur n'existe pas" });
          // res.send({ message: "L'utilisateur n'existe pas"});
        }
      }
    );
  } else if (type == "clients") {
    db.query(
      "SELECT * FROM users WHERE username = ?",
      username,
      (err, result) => {
        if (err) {
          //   console.log(err);
          res.send({ err: err });
        }
        //   res.send(result);
        if (result.length > 0) {
          bcrypt.compare(password, result[0].password, (error, response) => {
            if (response) {
              const id = result[0].id;
              const token = jwt.sign({ id }, "jwtSecret", {
                expiresIn: 6000,
              });
              req.session.user = result;

              // res.send(result);
              res.json({ auth: true, token: token, result: result });
            } else {
              // res.send({ message: "Mauvaise combinaison"})
              res.json({ auth: false, message: "Mauvaise combinaison" });
            }
          });
        } else {
          res.json({ auth: false, message: "L'utilisateur n'existe pas" });
          // res.send({ message: "L'utilisateur n'existe pas"});
        }
      }
    );
  }
});

const verifyJWT = (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    res.send("Nous avons besoin du token, donnez le nous prochainement!");
  } else {
    jwt.verify(token, "jwtSecret", (err, decoded) => {
      if (err) {
        res.json({ auth: false, message: "Connexion expir??e" });
      } else {
        req.userId = decoded.id;
        next();
      }
    });
  }
};

app.get("/isUserAuth", verifyJWT, (req, res) => {
  res.send("Vous etes authentifier");
});

app.put("/changepassword", async (req, res) => {
  const { oldPassword, newPassword, username, type } = req.body;

  if (type == "sellers") {
    db.query(
      "SELECT * FROM sellers WHERE username = ?",
      username,
      (err, result) => {
        if (err) {
          //   console.log(err);
          res.send({ err: err });
        }
        //   res.send(result);
        if (result.length > 0) {
          bcrypt
            .compare(oldPassword, result[0].password)
            .then(async (match) => {
              if (!match) {
                res.json({ error: "Wrong Password Entered!" });
              } else {
                bcrypt.hash(newPassword, 10).then((hash) => {
                  db.query(
                    "UPDATE sellers SET password = ? WHERE username = ?",
                    [hash, username],
                    (err, result) => {
                      if (err) {
                        console.log(err);
                      } else {
                        // console.log('succes');
                        // res.send(result);
                        res.json("SUCCESS");
                      }
                    }
                  );
                });
              }
            });
        }
        //   else {
        //       res.json({auth: false, message: "L'utilisateur n'existe pas" });
        //       // res.send({ message: "L'utilisateur n'existe pas"});
        //   }
      }
    );
  } else if (type == "clients") {
    db.query(
      "SELECT * FROM users WHERE username = ?",
      username,
      (err, result) => {
        if (err) {
          //   console.log(err);
          res.send({ err: err });
        }
        //   res.send(result);
        if (result.length > 0) {
          bcrypt
            .compare(oldPassword, result[0].password)
            .then(async (match) => {
              if (!match) {
                res.json({ error: "Wrong Password Entered!" });
              } else {
                bcrypt.hash(newPassword, 10).then((hash) => {
                  db.query(
                    "UPDATE users SET password = ? WHERE username = ?",
                    [hash, username],
                    (err, result) => {
                      if (err) {
                        console.log(err);
                      } else {
                        // console.log('succes');
                        // res.send(result);
                        res.json("SUCCESS");
                      }
                    }
                  );
                });
              }
            });
        }
        //   else {
        //       res.json({auth: false, message: "L'utilisateur n'existe pas" });
        //       // res.send({ message: "L'utilisateur n'existe pas"});
        //   }
      }
    );
  }
});

//Liste categories
app.get("/affichecategory", (req, res) => {
  db.query("SELECT * FROM category", (err, result) => {
    {
      /* -la biblioth??que axios permet d'envoyer les requ??tes de recherche sql dans la base de donn??es gr??ce aux fonctions post get put  */
    }
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//Liste libell?? statut
app.get("/affichelibstat", (req, res) => {
  db.query("SELECT * FROM statuscommande", (err, result) => {
    {
      /* -la biblioth??que axios permet d'envoyer les requ??tes de recherche sql dans la base de donn??es gr??ce aux fonctions post get put  */
    }
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//r??cup??ration d'une category
app.post("/recupcat", (req, res) => {
  const id = req.body.id;
  db.query("SELECT * FROM category  WHERE id =?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/supprpan", (req, res) => {
  db.query("DELETE FROM panier where 1=1 ", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.delete("/deletepan/:ide", (req, res) => {
  const id = req.params.ide;
  db.query("DELETE FROM panier WHERE product_id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.put("/majpan", (req, res) => {
  const product_quantity = req.body.product_quantity;
  const product_id = req.body.product_id;
  const total_price = req.body.price * req.body.product_quantity;
  db.query(
    "UPDATE panier SET product_quantity = ?, total_price= ? WHERE product_id = ? ",
    [product_quantity, total_price, product_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.put("/majlike", (req, res) => {
  const id = req.body.id;
  const nblike = req.body.nblike;
  const addlike = req.body.addlike;
  db.query(
    "UPDATE products SET like_number = ? WHERE id = ? ",
    [nblike + addlike, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(success);
      }
    }
  );
});

//afficher le panier
app.get("/affichepanier", (req, res) => {
  db.query("SELECT * FROM panier", (err, result) => {
    {
      /* -la biblioth??que axios permet d'envoyer les requ??tes de recherche sql dans la base de donn??es gr??ce aux fonctions post get put  */
    }
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//ajouter au panier

app.post("/ajoutpanier", (req, res) => {
  {
    /* -Pour l'ex??cution des requ??tes on a besoin d'initialiser une connexion ?? la bd et qui contiendra les identifiants de connexions   */
  }
  const product_id = req.body.product_id;
  const unite_price = req.body.unite_price;
  const product_quantity = req.body.product_quantity;
  const total_price = req.body.total_price;
  const product_name = req.body.product_name;
  const stock = req.body.stock;

  db.query(
    "INSERT INTO panier (product_id, product_name, unite_price, product_quantity, total_price,stock) VALUES (?,?,?,?,?,?)",
    [
      product_id,
      product_name,
      unite_price,
      product_quantity,
      total_price,
      stock,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("suc");
      }
    }
  );
});

// cr??er une commande
app.post("/ajoutcommande", (req, res) => {
  const totalquant = req.body.totalquant;
  const totalprix = req.body.totalprix;
  const invoice = req.body.invoice;
  const whatsapp = req.body.whatsapp;
  const id_boutique = req.body.id_boutique;
  db.query(
    "INSERT INTO command_validation (invoice, total_quantity, total_price, whatsapp,seller_id) VALUES (?,?,?,?,?)",
    [invoice, totalquant, totalprix, whatsapp, id_boutique],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("suc");
      }
    }
  );
});

// cr??er une vente
app.post("/ajoutvente", (req, res) => {
  const totalquant = req.body.totalquant;
  const totalprix = req.body.totalprix;
  const invoice = req.body.invoice;
  const status = 3;
  const whatsapp = "";
  const id_boutique = req.body.id_boutique;
  db.query(
    "INSERT INTO command_validation (invoice, total_quantity, total_price, status_id_command, whatsapp,seller_id) VALUES (?,?,?,?,?,?)",
    [invoice, totalquant, totalprix, status, whatsapp, id_boutique],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("suc");
      }
    }
  );
});

app.post("/ajoutapprov", (req, res) => {
  const totalquant = req.body.totalquant;
  const totalprix = req.body.totalprix;
  const invoice = req.body.invoice;
  const id_boutique = req.body.id_boutique;
  db.query(
    "INSERT INTO approvisionnement_validation (invoice, total_quantity, total_price,seller_id) VALUES (?,?,?,?)",
    [invoice, totalquant, totalprix, id_boutique],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("suc");
      }
    }
  );
});

// cr??er liste commande
app.post("/ajoutcomList", (req, res) => {
  let numfin = 0;
  let newnum = 0;
  const panier = req.body.panier;
  let id = 0;
  let taillecom = [];
  const tail = req.body.tail;
  const whatsapp = req.body.whatsapp;
  const picture1 = "uploads/1660942837.jpg";
  const id_boutique = req.body.id_boutique;

  db.query("SELECT * FROM command_validation", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      if (result) {
        db.query(
          "SELECT MAX(id) AS TOTA FROM command_validation",
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              id = result[0].TOTA;
              db.query(
                "SELECT * FROM command_validation WHERE id = ?",
                id,
                (err, result) => {
                  if (err) {
                    console.log(err);
                  } else {
                    numfin = parseInt(result[0].invoice.slice(5));
                    newnum = numfin + 1;
                    invoice = `FAB00${newnum}`;
                    for (var i = 0; i < tail; i++) {
                      db.query(
                        "INSERT INTO commands (product_quantity, total_price , unite_price , product_name,product_id, invoice, whatsapp,picture,seller_id) VALUES (?,?,?,?,?,?,?,?,?)",
                        [
                          panier[i].product_quantity,
                          panier[i].total_price,
                          panier[i].unite_price,
                          panier[i].product_name,
                          panier[i].product_id,
                          invoice,
                          whatsapp,
                          picture1,
                          id_boutique,
                        ],
                        (err, result) => {
                          if (err) {
                            console.log(err);
                          } else {
                          }
                        }
                      );
                    }
                    res.send(invoice);
                  }
                }
              );
            }
          }
        );
      }
    }
  });
});

app.post("/ajoutapprovList", (req, res) => {
  let numfin = 0;
  let newnum = 0;
  const panier = req.body.approv;
  let id = 0;
  const tail = req.body.tail;
  let invoice = 0;
  const id_boutique = req.body.id_boutique;
  db.query("SELECT * FROM approvisionnement_validation", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      if (result) {
        db.query(
          "SELECT MAX(id) AS TOTA FROM approvisionnement_validation",
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              id = result[0].TOTA;
              db.query(
                "SELECT * FROM approvisionnement_validation WHERE id = ?",
                id,
                (err, result) => {
                  if (err) {
                    console.log(err);
                  } else {
                    numfin = parseInt(result[0].invoice.slice(5));
                    newnum = numfin + 1;
                    invoice = `FAB00${newnum}`;
                    for (var i = 0; i < tail; i++) {
                      db.query(
                        "INSERT INTO approvisionnement (stock_appro, total_price , unite_price , product_name,product_id, invoice, stock_preview,picture,seller_id) VALUES (?,?,?,?,?,?,?,?,?)",
                        [
                          panier[i].stock_appro,
                          panier[i].total_price,
                          panier[i].unite_price,
                          panier[i].product_name,
                          panier[i].product_id,
                          invoice,
                          panier[i].stock_preview,
                          panier[i].picture,
                          id_boutique,
                        ],
                        (err, result) => {
                          if (err) {
                            console.log(err);
                          } else {
                            /* res.json({ind:i}); */
                          }
                        }
                      );
                    }
                    res.send(invoice);
                  }
                }
              );
            }
          }
        );
      }
    }
  });
});

app.post("/ajoutapprovList1", (req, res) => {
  let numfin = 0;
  let newnum = 0;
  const stock_appro = req.body.stock_appro;
  const total_price = req.body.total_price;
  const unite_price = req.body.unite_price;
  const product_name = req.body.product_name;
  const product_id = req.body.product_id;
  const stock_preview = req.body.stock_preview;
  const picture = req.body.picture;
  let id = 0;
  let invoice = 0;
  const id_boutique = req.body.id_boutique;
  db.query(
    "INSERT INTO approvisionnement (stock_appro, total_price , unite_price , product_name,product_id, invoice, stock_preview,picture,seller_id) VALUES (?,?,?,?,?,?,?,?,?)",
    [
      stock_appro,
      total_price,
      unite_price,
      product_name,
      product_id,
      invoice,
      stock_preview,
      picture,
      id_boutique,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        /* res.json({ind:i}); */
        res.send("suc");
      }
    }
  );
});

app.post("/reclusia", (req, res) => {
  const pan = req.body.panier;

  db.query(
    "SELECT * FROM products  WHERE id =?",
    panier[0].product_id,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//r??cup??ration d'un article
app.post("/recupart", (req, res) => {
  const id = req.body.id;

  db.query("SELECT * FROM products  WHERE id =?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});
//test
app.post("/test1", (req, res) => {
  const id = req.body.id;

  res.send(id + "");
});

//liste des articles
app.post("/afficheart", (req, res) => {
  const id_boutique = req.body.id_boutique;

  db.query(
    "SELECT * FROM products where seller_id = ?",
    id_boutique,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
//liste des articles par ordre croissant
app.get("/afficheartcroiss", (req, res) => {
  db.query("SELECT * FROM products ORDER BY name ASC", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//`SELECT * FROM todotbl ORDER BY id DESC LIMIT 10`

app.get("/arrivage", (req, res) => {
  db.query(
    `SELECT * FROM products ORDER BY id DESC LIMIT 10`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/recent", (req, res) => {
  const dateact = req.body.dateact;
  db.query(
    `SELECT * FROM products WHERE creation_date >= ?`,
    dateact,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.get("/populaire", (req, res) => {
  db.query(`SELECT * FROM products WHERE like_number >= 50`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/datenow", (req, res) => {
  db.query(`SELECT NOW()`, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result + " ");
    }
  });
});

//liste des articles par categorie
app.post("/articlecateg", (req, res) => {
  const idcat = req.body.idcat;
  db.query(
    "SELECT * FROM products  WHERE category_id =?",
    idcat,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste des commandes
app.post("/affichecommande", (req, res) => {
  const id_boutique = req.body.id_boutique;
  db.query(
    "SELECT * FROM command_validation where seller_id = ?",
    id_boutique,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste des approvisionnements
app.post("/afficheapprov", (req, res) => {
  const id_boutique = req.body.id_boutique;
  db.query(
    "SELECT * FROM approvisionnement_validation where seller_id = ?",
    id_boutique,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste des commandes valid??es
app.get("/affichecomv", (req, res) => {
  db.query(
    "SELECT * FROM command_validation WHERE statut =1 ",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste articles par commande
app.post("/afficheartcom", (req, res) => {
  const invoice = req.body.invoice;
  const id_boutique = req.body.id_boutique;
  db.query(
    "SELECT * FROM commands WHERE invoice =? and seller_id = ?",
    [invoice, id_boutique],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste articles par approvisionnement
app.post("/afficheartapprov", (req, res) => {
  const invoice = req.body.invoice;
  const id_boutique = req.body.id_boutique;
  db.query(
    "SELECT * FROM approvisionnement WHERE invoice =? and seller_id = ?",
    [invoice, id_boutique],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//mise ?? jour satut
app.post("/majstatut", (req, res) => {
  const invoice = req.body.invoice;
  const stat = req.body.stat;
  const id_boutique = req.body.id_boutique;
  db.query(
    "UPDATE command_validation SET status_id_command = ? WHERE invoice =? and seller_id = ?",
    [stat, invoice, id_boutique],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

app.put("/imga/:id/:stat", async (req, res) => {
  const id = req.params.id;
  const stat = req.params.stat;
  // 'avatar' is the name of our file input field in the HTML form
  let upload = multer({ storage: storage }).single("avatar");

  upload(req, res, function (err) {
    // req.file contains information of uploaded file
    // req.body contains information of text fields

    if (!req.file) {
      return res.send("Please select an image to upload");
    } else if (err instanceof multer.MulterError) {
      return res.send(err);
    } else if (err) {
      return res.send(err);
    }
    let classifiedsadd = { picture2: req.file.filename };
    if (stat == 1) {
      classifiedsadd = {
        picture1: "uploads/" + req.file.filename,
      };
    }
    if (stat == 2) {
      classifiedsadd = {
        picture2: "uploads/" + req.file.filename,
      };
    }
    if (stat == 3) {
      classifiedsadd = {
        picture3: "uploads/" + req.file.filename,
      };
    }
    if (stat == 4) {
      classifiedsadd = {
        picture4: "uploads/" + req.file.filename,
      };
    }
    if (stat == 5) {
      classifiedsadd = {
        video: "uploads/" + req.file.filename,
      };
    }

    //	const sql = "UPDATE products SET picture2 = ? WHERE id = 47";
    const sql = "UPDATE products SET ? WHERE id = ?";
    db.query(sql, [classifiedsadd, id], (err, results) => {
      if (err) {
        res.send(err);
      } else {
        res.json({ success: 1 });
      }
      //	res.json({ success: 1 }) ;
      //   res.send(id+"");
    });
  });

  //res.send(id+"");
});

app.post("/newart", async (req, res) => {
  const nom = req.body.nom;
  const prix = req.body.prix;
  const reduc = req.body.reduc;
  const description = req.body.descript;
  const stock = req.body.stock;
  const seller_id = req.body.seller_id;
  const category = req.body.category;
  const promotion = req.body.promotion;
  const mdlivraison = req.body.mdlivraison;
  const delailivre = req.body.delailivre;
  const disponibilite = req.body.disponibilite;
  const prixachat = req.body.prixachat;
  const id_boutique = req.body.id_boutique;
  const picture1 = "uploads/aliments.png";
  db.query(
    "INSERT INTO products (name,price,description,discount,seller_id,stock, category_id, cost,picture1 ) VALUES (?,?,?,?,?,?,?,?,?)",
    [
      nom,
      prix,
      description,
      reduc,
      seller_id,
      stock,
      category,
      prixachat,
      picture1,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        //res.send("suc");
        db.query("SELECT  MAX(id) AS tota FROM products ", (err, result) => {
          if (err) {
            console.log(err);
          } else {
            res.send(result);
          }
        });
      }
    }
  );
});

app.post("/editerart", async (req, res) => {
  const nom = req.body.nom;
  const prix = req.body.prix;
  const reduc = req.body.reduc;
  const description = req.body.descript;
  const stock = req.body.stock;
  const seller_id = req.body.seller_id;
  const category = req.body.category;
  const disponibilite = req.body.disponibilite;
  const prixachat = req.body.prixachat;
  const id = req.body.id;
  const mdlivraison = req.body.mdlivraison;
  const delailivre = req.body.delailivre;
  const promotion = req.body.promotion;
  const id_boutique = req.body.id_boutique;

  db.query(
    "UPDATE products SET name=?,price=?,description=?,discount=?,seller_id=?,stock=?, category_id=?, disponibilite=?, mode_livraison=? , delai_livraison =? , discount_value =? ,cost=?  WHERE id = ?",
    [
      nom,
      prix,
      description,
      reduc,
      seller_id,
      stock,
      category,
      disponibilite,
      mdlivraison,
      delailivre,
      promotion,
      prixachat,
      id,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("suc");
      }
    }
  );
});

app.post("/supprart", (req, res) => {
  const id = req.body.id;
  //supprimer img
  fs.unlink("uploads/yelan.png", (err) => {
    if (err) {
      console.error(err);
      return;
    }

    //file removed
  });
  //
  db.query("DELETE FROM products WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("succes");
      res.send("succ12");
    }
  });
  //res.send(" "+id+"fgf");
});

app.post("/approv", (req, res) => {
  const id = req.body.id;
  const quantite = req.body.quantite;
  db.query(
    "UPDATE products SET stock=?  WHERE id = ?",
    [quantite, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("suc");
      }
    }
  );
});

app.post("/approv2", (req, res) => {
  const tail = req.body.tail;
  const approv = req.body.approv;
  const id_boutique = req.body.id_boutique;
  for (var i = 0; i < tail; i++) {
    db.query(
      "UPDATE products SET stock=?  WHERE id = ? and seller_id= ?",
      [
        approv[i].stock_appro + approv[i].stock_preview,
        approv[i].product_id,
        id_boutique,
      ],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
        }
      }
    );
  }
  res.send("suc");
});
app.post("/approv3", (req, res) => {
  const stock = req.body.stock;
  const product_id = req.body.product_id;
  const id_boutique = req.body.id_boutique;
  db.query(
    "UPDATE products SET stock = ?  WHERE id = ? and seller_id = ?",
    [stock, product_id, id_boutique],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("suc");
      }
    }
  );
});

app.post("/reducquant", (req, res) => {
  const tail = req.body.tail;
  const reduc = req.body.reduc;
  const id_boutique = req.body.id_boutique;
  for (var i = 0; i < tail; i++) {
    db.query(
      "UPDATE products SET stock=?, total_sold= ?  WHERE id = ? and seller_id = ?",
      [
        reduc[i].stock - reduc[i].product_quantity,
        reduc[i].total_sold + reduc[i].product_quantity,
        reduc[i].product_id,
        id_boutique,
      ],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
        }
      }
    );
  }
  res.send("succs");
});

app.get("/uploads/:name", function (req, res) {
  const name = req.params.name;
  res.sendFile(name);
});

app.post("/rej", (req, res) => {
  //  const id = req.body.id;
  res.send(2);
});

//*************************************************      nelson     **********************************************************************

/* obtenir la liste des produits */
app.get("/productslist", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});
/* detail d'un produit*/
app.post("/detailProduct", (req, res) => {
  const productId = req.body.productId;

  db.query(
    "SELECT * FROM products WHERE id = ?",
    [productId],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        // console.log(result);
        res.send(result);
      }
    }
  );
});
/* obtenir l'invoice*/
app.get("/getInvoice", (req, res) => {
  let invoice = "";
  let nbrligne = 0;
  let numfacend = 0;
  let newfacend = 0;
  db.query("SELECT * FROM commands", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      nbrligne = result.length;
      if (nbrligne > 0) {
        db.query("SELECT MAX(id) AS TOTA FROM commands", (err, result) => {
          if (err) {
            console.log(err);
          } else {
            db.query(
              "SELECT * FROM commands WHERE id = ?",
              [result[0].TOTA],
              (err, result) => {
                if (err) {
                  console.log(err);
                } else {
                  numfacend = parseInt(result[0].invoice.slice(5));
                  // numfacend = parseInt(result[0].invoice.split('0')[2]);
                  newfacend = numfacend + 1;
                  invoice = `FAB00${newfacend}`;
                  res.send(invoice);
                }
              }
            );
          }
        });
      } else {
        invoice = "FAB001";
        res.send(invoice);
      }
    }
  });
});
/* ajouter au panier */
app.post("/addcart", (req, res) => {
  const product_id = req.body.product_id;
  const product_quantity = req.body.product_quantity;
  const product_name = req.body.product_name;
  const unite_price = req.body.unite_price;
  const total_price = req.body.total_price;
  const picture = req.body.picture;
  const invoice = req.body.invoice;
  const whatsapp = req.body.num;

  db.query(
    "INSERT INTO commands (product_id, product_quantity, product_name, unite_price, total_price, picture, invoice, whatsapp) VALUES (?,?,?,?,?,?,?,?)",
    [
      product_id,
      product_quantity,
      product_name,
      unite_price,
      total_price,
      picture,
      invoice,
      whatsapp,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Values Inserted");
      }
    }
  );
});
/* obtenir la liste des commandes valid??es par l'utilisateur */
app.post("/historique", (req, res) => {
  const invoice = req.body.invoice;
  db.query(
    "SELECT * FROM commands WHERE invoice = ?",
    [invoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
/* recup??rer le status d'une commande d??j?? passer */
app.post("/recupStatusCommand", (req, res) => {
  const invoice = req.body.invoice;
  db.query(
    "SELECT status_id_command FROM commands WHERE invoice = ?",
    [invoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        // res.send(result);
        db.query(
          "SELECT libeller FROM statuscommande WHERE id = ?",
          [result[0]],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});
/* obtenir la liste des commandes */
app.post("/getcommands", (req, res) => {
  const statut = 0;
  db.query(
    "SELECT * FROM commands WHERE statut = ?",
    [statut],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
/*suppression d'un ??l??ments du panier */
app.delete("/supprimerduPanier/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM commands WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("succes");
      res.send(result);
    }
  });
});
/*validation de la commande */
app.post("/updatecart", (req, res) => {
  const invoice = req.body.invoice;
  const total_price = req.body.total_price;
  const total_quantity = req.body.total_quantity;
  const num = req.body.num;

  db.query(
    "INSERT INTO command_validation (total_quantity, total_price, invoice, whatsapp) VALUES (?,?,?,?)",
    [total_quantity, total_price, invoice, num],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        // res.send("Values Inserted");
        db.query(
          "SELECT date FROM command_validation WHERE invoice = ?",
          [invoice],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});
/* rechercher une commande */
app.post("/recherchcommand", (req, res) => {
  const product_id = req.body.product_id;
  const statut = 0;
  db.query(
    "SELECT * FROM commands WHERE product_id = ? AND statut = ?",
    [product_id, statut],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
/*mise ?? jour de la quantit?? de produit commander */
app.put("/updatecommand", (req, res) => {
  const id = req.body.id;
  const product_quantity = req.body.product_quantity;
  const total_price = req.body.total_price;

  db.query(
    "UPDATE commands SET product_quantity = ?, total_price = ? WHERE id = ?",
    [product_quantity, total_price, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        // console.log('succes');
        res.send("Values Inserted");
      }
    }
  );
});

//******************************************************     vital     *****************************************************************

// REST API CURD

app.get("/api", (req, res) => {
  res.send("Api working");
});

// Create data

app.post("/api/create/:nom/:prenom", (req, res) => {
  console.log(req.body);
  console.log(req.params.nom);
  console.log(req.params.prenom);
  // const nom = req.body.nom
  // const prenom = req.body.prenom
  const nom = req.params.nom;
  const prenom = req.params.prenom;

  // sql query

  let sql = ` INSERT INTO todotbl(nom, prenom)
                VALUES('${nom}', '${prenom}')
               `;
  // run query
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send("data inserted");
  });
});

// Read data
app.get("/api/read", (req, res) => {
  // sql query
  let val = 50;
  let sql = `SELECT * FROM products where like_number > ?`;
  // run query
  db.query(
    `SELECT * FROM products where like_number > ? `,
    val,
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

app.get("/api/reader", (req, res) => {
  // sql query
  let val = 50;
  let sql = `SELECT * FROM products where like_number > ?`;
  // run query
  db.query(
    `SELECT * FROM products where like_number < ? `,
    val,
    (err, result) => {
      if (err) throw err;
      res.send(result);
    }
  );
});

// Read single data
app.get("/api/reading", (req, res) => {
  console.log(req.body.id);
  const id = req.body.id;
  // sql query
  let sql = `SELECT * FROM todotbl`;
  // run query
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

// update single data

app.put("/api/update/:id/:nom/:prenom", (req, res) => {
  console.log(req.params);
  const id = req.params.id;
  const nom = req.params.nom;
  const prenom = req.params.prenom;
  // sql query

  db.query(
    "UPDATE todotbl SET nom = ?, prenom = ? WHERE id = ? ",
    [nom, prenom, id],
    (err, result) => {
      if (err) {
        console.log(err);
        //  throw err;
      } else {
        res.send("data updated");
      }
    }
  );
});

// delete single data

app.delete("/api/delete/:id", (req, res) => {
  const id = req.params.id;
  // sql query

  db.query("DELETE FROM todotbl WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send("data deleted");
      // res.send(result);
    }
  });
});

app.get("/invoice", (req, res) => {
  // sql query
  let idmax;
  let lastinvoice;
  //let sql = `SELECT * FROM todotbl`;
  // run query
  db.query("SELECT MAX(id) AS TOTA FROM command_validation", (err, result) => {
    if (err) throw err;
    idmax = result[0].TOTA;
    // db.query("SELECT invoice FROM command_validation WHERE id = ?",idmax,(err,result)=>{
    //     if(err) throw err;
    //     console.log(result[0].invoice);
    // });

    res.send(`${idmax}`);
  });
});

app.get("/invoicee", (req, res) => {
  // sql query
  let idmax;
  let status = 1;
  //let sql = `SELECT * FROM todotbl`;
  // run query
  db.query("SELECT MAX(id) AS TOTA FROM commands", (err, result) => {
    if (err) throw err;
    idmax = result[0].TOTA;
    db.query(
      "SELECT statut FROM commands WHERE id = ?",
      idmax,
      (err, result) => {
        if (err) throw err;
        status = result[0].statut;
        if (status == 0) {
          let hac = 0;
          console.log("pas nouvelle facture");
          res.send(`${hac}`);
        } else {
          let hac = 1;
          console.log("nouvelle facture");
          res.send(`${hac}`);
        }
        //console.log(result[0].statut);
      }
    );
    // res.send(`${idmax}`);
  });
});

app.get("/cherchernumfaclast", (req, res) => {
  // sql query
  let idmax;

  db.query("SELECT MAX(id) AS TOTA FROM commands", (err, result) => {
    if (err) throw err;
    idmax = result[0].TOTA;
    db.query(
      "SELECT invoice FROM commands WHERE id = ?",
      idmax,
      (err, result) => {
        if (err) throw err;
        invoicer = result[0].invoice;
        res.send(`${invoicer}`);
      }
    );
    // res.send(`${idmax}`);
  });
});

app.get("/exitcont", (req, res) => {
  db.query("SELECT * FROM commands", (err, result) => {
    if (err) throw err;
    numRows = result.length;
    console.log(numRows);
    res.send(`${numRows}`);
  });
});

app.get("/nombrartpan", (req, res) => {
  let idmax;
  db.query("SELECT MAX(id) AS TOTA FROM commands ", (err, result) => {
    if (err) throw err;
    idmax = result[0].TOTA;
    db.query(
      "SELECT invoice,statut FROM commands WHERE id = ?",
      idmax,
      (err, result) => {
        if (err) throw err;
        console.log(result[0].invoice);
        console.log(result[0].statut);
        let stat = result[0].statut;
        let inv = result[0].invoice;
        if (stat == 0) {
          db.query(
            "SELECT invoice FROM commands where invoice=?",
            inv,
            (err, result) => {
              if (err) throw err;
              numRows = result.length;
              console.log(numRows);
              res.send(`${numRows}`);
            }
          );
        } else {
          res.send("");
        }
      }
    );
  });
});

app.post("/exitart", (req, res) => {
  const nfac = req.body.nfac;
  const product_name = req.body.product_name;
  db.query(
    "SELECT product_name FROM commands where invoice=? and product_name=?",
    [nfac, product_name],
    (err, result) => {
      if (err) throw err;
      numRows = result.length;
      console.log(numRows);
      res.send(`${numRows}`);
    }
  );
});
app.post(
  "/createcommand/:statut/:product_id/:product_name/:unite_price/:product_quantity/:total_price/:invoice/:picture",
  (req, res) => {
    const statut = req.params.statut;
    const product_id = req.params.product_id;
    const product_name = req.params.product_name;
    const unite_price = req.params.unite_price;
    const product_quantity = req.params.product_quantity;
    const total_price = req.params.total_price;
    const invoice = req.params.invoice;
    const picture = req.params.picture;

    let sql = ` INSERT INTO commands(statut, product_id, product_name, unite_price, product_quantity, total_price, invoice, picture)
                VALUES('${statut}', '${product_id}', '${product_name}', '${unite_price}', '${product_quantity}', '${total_price}', '${invoice}', '${picture}')
               `;
    // run query
    db.query(sql, (err, result) => {
      if (err) throw err;
      res.send("produit ajouter au panier");
    });
  }
);

app.post("/api/createe", (req, res) => {
  const statut = req.body.statut;
  const product_id = req.body.product_id;
  const product_name = req.body.product_name;
  const unite_price = req.body.unite_price;
  const product_quantity = req.body.product_quantity;
  const total_price = req.body.total_price;
  const invoice = req.body.invoice;
  const picture = req.body.picture;

  let sql = ` INSERT INTO commands(statut, product_id, product_name, unite_price, product_quantity, total_price, invoice, picture)
                VALUES('${statut}', '${product_id}', '${product_name}', '${unite_price}', '${product_quantity}', '${total_price}', '${invoice}', '${picture}')
               `;
  // run query
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send("produit ajouter au panier");
  });
});

app.get("/recuppan", (req, res) => {
  let idmax;
  db.query("SELECT MAX(id) AS TOTA FROM commands ", (err, result) => {
    if (err) throw err;
    idmax = result[0].TOTA;
    db.query(
      "SELECT invoice,statut FROM commands WHERE id = ?",
      idmax,
      (err, result) => {
        if (err) throw err;
        console.log(result[0].invoice);
        console.log(result[0].statut);
        let stat = result[0].statut;
        let inv = result[0].invoice;
        if (stat == 0) {
          db.query(
            "SELECT * FROM commands where invoice=?",
            inv,
            (err, result) => {
              if (err) throw err;
              numRows = result.length;
              console.log(result);
              res.send(result);
            }
          );
        } else {
          res.send("");
        }
      }
    );
  });
});

app.post("/nectar", (req, res) => {
  const id = req.body.id;
  db.query(
    "SELECT unite_price FROM commands WHERE id = ?",
    id,
    (err, result) => {
      if (err) throw err;
      console.log(result[0].unite_price);
      res.send(result[0].unite_price + "");
    }
  );
});

app.get("/totalprice", (req, res) => {
  let idmax;
  let total_price;
  db.query("SELECT MAX(id) AS TOTA FROM commands ", (err, result) => {
    if (err) throw err;
    idmax = result[0].TOTA;
    db.query(
      "SELECT invoice,statut FROM commands WHERE id = ?",
      idmax,
      (err, result) => {
        if (err) throw err;
        console.log(result[0].invoice);
        console.log(result[0].statut);
        let stat = result[0].statut;
        let inv = result[0].invoice;
        if (stat == 0) {
          db.query(
            "SELECT SUM(total_price) AS prix_total FROM commands where invoice=?",
            inv,
            (err, result) => {
              if (err) throw err;
              numRows = result.length;
              console.log(result[0].prix_total);
              total_price = result[0].prix_total;
              console.log(total_price);
              res.send(total_price + "");
            }
          );
        } else {
          res.send("");
        }
      }
    );
  });
});

app.get("/api/readingsim1", (req, res) => {
  console.log(req.body.id);
  const id = req.body.id;
  // sql query
  let sql = `SELECT * FROM todotbl WHERE simchoice = ?`;
  // run query
  db.query(sql, 0, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});
app.get("/api/readingsim2", (req, res) => {
  console.log(req.body.id);
  const id = req.body.id;
  // sql query
  let sql = `SELECT * FROM todotbl WHERE simchoice = ?`;
  // run query
  db.query(sql, 1, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/api/readinglast", (req, res) => {
  console.log(req.body.id);
  const id = req.body.id;
  // sql query
  let sql = `SELECT * FROM todotbl ORDER BY id DESC LIMIT 10`;
  // run query
  db.query(sql, 0, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.get("/api/readingmarch", (req, res) => {
  console.log(req.body.id);
  const id = req.body.id;
  // sql query
  let sql = `SELECT * FROM marchand`;
  // run query
  db.query(sql, (err, result) => {
    if (err) throw err;
    res.send(result);
  });
});

app.post("/addussd", (req, res) => {
  const libeler = req.body.libeler;
  const codeussd = req.body.codeussd;
  const simchoice = req.body.simchoice;
  db.query(
    "INSERT INTO todotbl (libeler, codeussd, simchoice) VALUES (?,?,?)",
    [libeler, codeussd, simchoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("code ussd ajouter avec  succes");
      }
    }
  );
});

app.post("/addmarchand", (req, res) => {
  const nommarchand = req.body.nommarchand;
  const idmarchand = req.body.idmarchand;
  const simchoice = req.body.simchoice;
  db.query(
    "INSERT INTO marchand (nom_marchand, id_marchand, simchoice) VALUES (?,?,?)",
    [nommarchand, idmarchand, simchoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Marchand cr??e avec  succes");
      }
    }
  );
});

app.delete("/delussd", (req, res) => {
  const id = req.body.id;
  db.query("DELETE FROM todotbl WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("succes");
      res.send("code ussd supprimer avec  succes");
    }
  });
});

/************************************************************************************vital shop back ***********************************************************************/

app.delete("/delarticle", (req, res) => {
  const id = req.body.id;
  db.query("DELETE FROM products WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log("succes");
      res.send("succes");
    }
  });
});
//r??cup??ration des commandes en cours
app.get("/commandecours", (req, res) => {
  const statut = 1;
  db.query(
    "SELECT invoice,whatsapp,command_date,livraison_date,customer_id, SUM(total_price) AS TOTALPRICE , SUM(product_quantity) AS TOTALQUANTITE,status_id_command,product_id,verifvalid FROM commands WHERE status_id_command = ?  GROUP BY invoice LIMIT 5",
    statut,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//r??cup??ration des commandes en cours
app.get("/commandecourstous", (req, res) => {
  const statut = 1;
  db.query(
    "SELECT invoice,whatsapp,command_date,livraison_date,customer_id, SUM(total_price) AS TOTALPRICE , SUM(product_quantity) AS TOTALQUANTITE,status_id_command,product_id,verifvalid FROM commands GROUP BY invoice ASC",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/detailscommandecours", (req, res) => {
  const invoice = req.body.invoice;
  const status_id_command = req.body.status_id_command;
  db.query(
    "SELECT product_name,invoice,whatsapp,command_date,livraison_date,customer_id, product_quantity , total_price, picture,status_id_command,product_id,verifvalid FROM commands WHERE invoice = ? and status_id_command = ?",
    [invoice, status_id_command],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//r??cup??ration des approvisionnement en cours
app.get("/approcours", (req, res) => {
  const statut = 0;
  db.query(
    "SELECT invoice, appro_date, SUM(total_price) AS TOTALPRICE , SUM(stock_appro) AS TOTALQUANTITE, verif_appro FROM approvionnement WHERE verif_appro = ?  GROUP BY invoice LIMIT 5",
    statut,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//r??cup??ration des approvisionnement en cours
app.get("/approcourstous1", (req, res) => {
  const statut = 0;
  db.query(
    "SELECT invoice, appro_date, SUM(total_price) AS TOTALPRICE , SUM(stock_appro) AS TOTALQUANTITE, verif_appro FROM approvionnement WHERE verif_appro = ? GROUP BY invoice ASC",
    statut,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
//r??cup??ration des approvisionnement en cours
app.get("/approcourstous2", (req, res) => {
  const statut = 1;
  db.query(
    "SELECT invoice, appro_date, SUM(total_price) AS TOTALPRICE , SUM(stock_appro) AS TOTALQUANTITE, verif_appro FROM approvionnement WHERE verif_appro = ? GROUP BY invoice ASC",
    statut,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/detailsapprocours", (req, res) => {
  const invoice = req.body.invoice;
  const verif_appro = req.body.verif_appro;
  db.query(
    "SELECT product_id,product_name,invoice,appro_date,boutique_id,total_price,stock_appro, stock_preview , verif_appro, picture FROM approvionnement WHERE invoice = ? and verif_appro = ?",
    [invoice, verif_appro],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.put("/changestatus", (req, res) => {
  const invoice = req.body.invoice;
  const status_id_command = req.body.status_id_command;
  db.query(
    "UPDATE commands SET status_id_command = ? WHERE invoice = ? ",
    [status_id_command, invoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        // res.send("succes");
        db.query(
          "UPDATE command_validation SET status_id_command = ? WHERE invoice = ? ",
          [status_id_command, invoice],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send("succes");
            }
          }
        );
      }
    }
  );
});

app.post("/recupverifcommand", (req, res) => {
  const statut = 1;
  const invoice = req.body.invoice;
  db.query(
    "SELECT verifvalid FROM commands where invoice = ?",
    [invoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/recupverifappro", (req, res) => {
  const statut = 1;
  const invoice = req.body.invoice;
  db.query(
    "SELECT verif_appro FROM approvionnement where invoice = ?",
    [invoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.put("/updateverifvalidcommande", (req, res) => {
  const verifvalid = req.body.verifvalid;
  const invoice = req.body.invoice;
  db.query(
    "UPDATE commands SET verifvalid = ? WHERE invoice = ? ",
    [verifvalid, invoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        //res.send("succes");
        db.query(
          "UPDATE command_validation SET verifvalid = ? WHERE invoice = ? ",
          [verifvalid, invoice],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send("succes");
            }
          }
        );
      }
    }
  );
});

app.put("/updateverifvalidappro", (req, res) => {
  const verif_appro = req.body.verif_appro;
  const invoice = req.body.invoice;
  db.query(
    "UPDATE approvionnement SET verif_appro = ? WHERE invoice = ? ",
    [verif_appro, invoice],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        //res.send("succes");
        db.query(
          "UPDATE approvisionnement_validation SET verif_appro = ? WHERE invoice = ? ",
          [verif_appro, invoice],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send("succes");
            }
          }
        );
      }
    }
  );
});

app.put("/changestockcommande", (req, res) => {
  const id_product = req.body.id_product;
  const invoice = req.body.invoice;
  let stockinit = 0;
  let quantcommand = 0;
  let stockupdate = 0;
  db.query(
    "SELECT stock FROM products  WHERE id = ? ",
    id_product,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        //res.send(result);
        stockinit = result[0].stock;
        db.query(
          "SELECT product_quantity FROM commands  WHERE product_id = ? and invoice = ?",
          [id_product, invoice],
          (err, resulta) => {
            if (err) {
              console.log(err);
            } else {
              //res.send(result);
              quantcommand = resulta[0].product_quantity;
              stockupdate = stockinit - quantcommand;
              db.query(
                "UPDATE products SET stock = ? WHERE id = ? ",
                [stockupdate, id_product],
                (err, result) => {
                  if (err) {
                    console.log(err);
                  } else {
                    // res.send(` stock mis a jour le stock inital est ${stockinit} et la quantite commander est ${quantcommand} et le nouveau stock a mettre a jour est ${stockupdate}`);
                    res.send("success");
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

app.put("/changestockappro", (req, res) => {
  const id_product = req.body.id_product;
  const invoice = req.body.invoice;
  let stockinit = 0;
  let quantcommand = 0;
  let stockupdate = 0;
  db.query(
    "SELECT stock FROM products  WHERE id = ? ",
    id_product,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        //res.send(result);
        stockinit = result[0].stock;
        db.query(
          "SELECT stock_appro FROM approvionnement  WHERE product_id = ? and invoice = ?",
          [id_product, invoice],
          (err, resulta) => {
            if (err) {
              console.log(err);
            } else {
              //res.send(result);
              quantappro = resulta[0].stock_appro;
              stockupdate = stockinit + quantappro;
              db.query(
                "UPDATE products SET stock = ? WHERE id = ? ",
                [stockupdate, id_product],
                (err, result) => {
                  if (err) {
                    console.log(err);
                  } else {
                    // res.send(` stock mis a jour le stock inital est ${stockinit} et la quantite commander est ${quantcommand} et le nouveau stock a mettre a jour est ${stockupdate}`);
                    res.send("success");
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});
app.get("/recupe_status_command", (req, res) => {
  db.query("SELECT * FROM statuscommande", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/recupe_commandd", (req, res) => {
  db.query("SELECT * FROM commands", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//creation d'une commande valider

app.post("/creat_command_validation", (req, res) => {
  const invoice = req.body.invoice;
  const product_quantity = req.body.product_quantity;
  const total_price = req.body.total_price;
  const whatsapp = req.body.num;
  db.query(
    "insert into command_validation(invoice, total_quantity, total_price, whatsapp) values (?, ?, ?, ?)",
    [invoice, product_quantity, total_price, whatsapp],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

//bilan journalier
app.post("/bilan_day", (req, res) => {
  const datee = req.body.date;
  //const date = "2022-06-30";
  var mois = "";
  var today = new Date();
  //   var date =
  //     today.getFullYear() +
  //     "-" +
  //     0 +
  //     (today.getMonth() + 1) +
  //     "-" +
  //     0 +
  //     today.getDate();
  if (String(today).split(" ")[1] == "Jan") {
    mois = "01";
  } else if (String(today).split(" ")[1] == "Feb") {
    mois = "02";
  } else if (String(today).split(" ")[1] == "Mar") {
    mois = "03";
  } else if (String(today).split(" ")[1] == "Apr") {
    mois = "04";
  } else if (String(today).split(" ")[1] == "May") {
    mois = "05";
  } else if (String(today).split(" ")[1] == "Jun") {
    mois = "06";
  } else if (String(today).split(" ")[1] == "Jul") {
    mois = "07";
  } else if (String(today).split(" ")[1] == "Aug") {
    mois = "08";
  } else if (String(today).split(" ")[1] == "Sep") {
    mois = "09";
  } else if (String(today).split(" ")[1] == "Oct") {
    mois = "10";
  } else if (String(today).split(" ")[1] == "Nov") {
    mois = "11";
  } else if (String(today).split(" ")[1] == "Dec") {
    mois = "12";
  }
  console.log(
    `L'ann??e est ${String(today).split(" ")[3]} et le jour est ${
      String(today).split(" ")[2]
    } et le mois est ${mois}`
  );
  console.log("" + today);
  var date = `${String(today).split(" ")[3]}-${mois}-${
    String(today).split(" ")[2]
  }`;
  console.log(date);
  const status_comand = req.body.status_comand;
  db.query(
    "SELECT product_id, product_name, SUM(total_price) AS TOTAL,  SUM(product_quantity) AS QUANTITE FROM commands WHERE command_date = ? and `status_id_command` = ? GROUP BY product_name",
    [date, status_comand],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//bilan periodique
app.post("/bilan_periodique", (req, res) => {
  const date1 = req.body.date1;
  const date2 = req.body.date2;
  const status_comand = req.body.status_comand;
  db.query(
    "SELECT product_id, product_name, SUM(total_price) AS TOTAL,  SUM(product_quantity) AS QUANTITE FROM commands  WHERE command_date BETWEEN  ? and ?  and status_id_command = ? GROUP BY product_name",
    [date1, date2, status_comand],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste cost and price
app.post("/costandprice", (req, res) => {
  const id = req.body.id;
  db.query(
    "SELECT price, cost FROM products  WHERE id = ? ",
    id,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

/* obtenir l'invoice*/
app.get("/getInvoiceappro", (req, res) => {
  let invoice = "";
  let nbrligne = 0;
  let numfacend = 0;
  let newfacend = 0;
  db.query("SELECT * FROM  approvionnement", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      nbrligne = result.length;
      if (nbrligne > 0) {
        db.query(
          "SELECT MAX(id) AS TOTA FROM  approvionnement",
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              db.query(
                "SELECT * FROM  approvionnement WHERE id = ?",
                [result[0].TOTA],
                (err, result) => {
                  if (err) {
                    console.log(err);
                  } else {
                    numfacend = parseInt(result[0].invoice.slice(5));
                    // numfacend = parseInt(result[0].invoice.split('0')[2]);
                    newfacend = numfacend + 1;
                    invoice = `FAB00${newfacend}`;
                    res.send(invoice);
                  }
                }
              );
            }
          }
        );
      } else {
        invoice = "FAB001";
        res.send(invoice);
      }
    }
  });
});
/* ajouter au panier  approvisionnement*/
app.post("/addcartappro", (req, res) => {
  const product_id = req.body.product_id;
  const product_quantity = req.body.product_quantity;
  const product_name = req.body.product_name;
  const unite_price = req.body.unite_price;
  const total_price = req.body.total_price;
  const picture = req.body.picture;
  const invoice = req.body.invoice;
  const stockprev = req.body.stockprev;
  const whatsapp = req.body.num;

  db.query(
    "INSERT INTO  approvionnement (product_id, stock_appro, product_name, unite_price, total_price, picture, invoice, stock_preview) VALUES (?,?,?,?,?,?,?,?)",
    [
      product_id,
      product_quantity,
      product_name,
      unite_price,
      total_price,
      picture,
      invoice,
      stockprev,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Values Inserted");
      }
    }
  );
});

//creation d'une approvisionnement

app.post("/creat_appro_validation", (req, res) => {
  const invoice = req.body.invoice;
  const product_quantity = req.body.product_quantity;
  const total_price = req.body.total_price;
  const whatsapp = req.body.num;
  db.query(
    "insert into approvisionnement_validation(invoice, total_quantity, total_price) values (?, ?, ?)",
    [invoice, product_quantity, total_price],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

app.post("/recherchermed", (req, res) => {
  const nom = req.body.nom;

  db.query(
    "SELECT * FROM medecin  WHERE nom LIKE '%" + nom + "%'",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste des articles par ordre croissant
app.get("/afficheartcroiss", (req, res) => {
  db.query("SELECT * FROM products ORDER BY name ASC", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//liste des articles par categorie
app.post("/articlecateg", (req, res) => {
  const idcat = req.body.idcat;

  db.query(
    "SELECT * FROM products  WHERE category_id =?",
    idcat,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste des commandes
app.get("/affichecommande", (req, res) => {
  db.query("SELECT * FROM command_validation", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

//liste des commandes valid??es
app.get("/affichecomv", (req, res) => {
  db.query(
    "SELECT * FROM command_validation WHERE statut =1 ",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

//liste articles par commande
app.post("/afficheartcom", (req, res) => {
  const invoice = req.body.invoice;
  db.query(
    "SELECT * FROM commands WHERE invoice =? ",
    invoice,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
//mise ?? jour satut
app.post("/majstatut", (req, res) => {
  const invoice = req.body.invoice;
  db.query(
    "UPDATE command_validation SET statut = 1 WHERE invoice =? ",
    invoice,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

app.post("/licence_hash", (req, res) => {
  const hash = req.body.hash;
  /* const date_actu = req.body.date_actu */
  db.query(
    "insert into license(hash_code) values (?)",
    [hash],
    (err, result) => {
      if (!err) {
        res.send("success");
      } else {
        console.log(err);
      }
    }
  );
});

//liste of hash
app.get("/list_hash", (req, res) => {
  const status = "NON ACTIF";
  db.query(
    "SELECT * FROM license where id_boutique = 0 and status_hash = ?",
    status,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
//RECUP HEURE ACTUEL
app.get("/date_time", (req, res) => {
  db.query("SELECT NOW() as time_actu", (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.post("/majhash", (req, res) => {
  const id = req.body.id;
  const date_start = req.body.date_start;
  const status_hash = req.body.status_hash;
  const id_boutique = req.body.id_boutique;
  const validity = req.body.validity;
  db.query(
    "SELECT status_hash FROM license where id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        if (result[0].status_hash === "ACTIF") {
          res.send("deja");
        } else if (result[0].status_hash === "NON ACTIF") {
          db.query(
            "UPDATE license SET status_hash = ?, id_boutique = ?, date_start = ?, validity_time = ? WHERE id = ? ",
            [status_hash, id_boutique, date_start, validity, id],
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                res.send("success");
              }
            }
          );
        }
      }
    }
  );
});

app.post("/onehash", (req, res) => {
  const id = req.body.id;
  const status_hash = "ACTIF";
  db.query(
    "SELECT status_hash FROM license where id_boutique = ? and status_hash = ?",
    [id, status_hash],
    (err, result) => {
      if (err) throw err;
      numRows = result.length;
      console.log(numRows);
      if (numRows > 0) {
        for (var i = 0; i < numRows; i++) {
          if (result[i].status_hash === "ACTIF") {
            //  res.send("il a un hash actif");
            res.json({
              message: "boutique a hash",
            });
            break;
          }
        }
        res.json({ message: "boutique not hash" });
        // res.send(`${numRows}`);
      } else {
        res.json({ message: "aucun hash atribuer" });
      }
    }
  );
});

app.post("/exithash", (req, res) => {
  const id = req.body.id;
  db.query(
    "SELECT * FROM license where id_boutique = ?",
    [id],
    (err, result) => {
      if (err) throw err;
      numRows = result.length;
      console.log(numRows);
      if (numRows > 0) {
        for (var i = 0; i < numRows; i++) {
          if (result[i].status_hash === "ACTIF") {
            //  res.send("il a un hash actif");
            res.json({
              id_actif: result[i].id,
              date_start: result[i].date_start,
              date_end: result[i].date_end,
              message: "il a un hash actif",
            });
            break;
          }
        }
        res.json({ message: "aucun hash actif" });
        // res.send(`${numRows}`);
      } else {
        res.json({ message: "aucun hash atribuer" });
      }
    }
  );
});

app.post("/majvalidhash", (req, res) => {
  const id = req.body.id;
  const status_hash = req.body.status_hash;
  db.query(
    "UPDATE license SET status_hash = ? WHERE id = ? ",
    [status_hash, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

app.post("/majvalidity", (req, res) => {
  const id = req.body.id;
  const validity = req.body.validity;
  db.query(
    "UPDATE license SET validity_time = ? WHERE id = ? ",
    [validity, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

app.post("/validityday", (req, res) => {
  const id = req.body.id;
  const validity = req.body.validity;
  db.query(
    "UPDATE license SET validity_time = ? WHERE id = ? ",
    [validity, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

app.post("/profile_full", (req, res) => {
  const id = req.body.id;
  db.query(
    "SELECT store_name, adress, description, website, facebook, whatsapp FROM sellers where id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/majprofile", (req, res) => {
  const id = req.body.id;
  const boutique = req.body.boutique;
  const adress = req.body.adress;
  const description = req.body.description;
  const website = req.body.website;
  const facebook = req.body.facebook;
  const whatsapp = req.body.whatsapp;
  db.query(
    "UPDATE sellers SET store_name = ?, adress = ?, description = ?, website = ?, facebook = ?, whatsapp = ? where id = ?",
    [boutique, adress, description, website, facebook, whatsapp, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});
app.post("/majprofile1", (req, res) => {
  const id = req.body.id;
  const boutique = req.body.boutique;

  db.query(
    "UPDATE sellers SET store_name = ? where id = ?",
    [boutique, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

app.post("/majprofile2", (req, res) => {
  const id = req.body.id;
  const adress = req.body.adress;

  db.query(
    "UPDATE sellers SET adress = ? where id = ?",
    [adress, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});
app.post("/majprofile3", (req, res) => {
  const id = req.body.id;
  const description = req.body.description;
  db.query(
    "UPDATE sellers SET description = ? where id = ?",
    [description, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});
app.post("/majprofile4", (req, res) => {
  const id = req.body.id;
  const website = req.body.website;
  db.query(
    "UPDATE sellers SET website = ? where id = ?",
    [website, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});
app.post("/majprofile5", (req, res) => {
  const id = req.body.id;
  const facebook = req.body.facebook;
  db.query(
    "UPDATE sellers SET facebook = ? where id = ?",
    [facebook, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});
app.post("/majprofile6", (req, res) => {
  const id = req.body.id;
  const whatsapp = req.body.whatsapp;
  db.query(
    "UPDATE sellers SET whatsapp = ? where id = ?",
    [whatsapp, id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});

app.get("/versionapp", (req, res) => {
  const versionapp = "1.0.0";
  res.send(versionapp);
});

// recupe caisse value
app.post("/caisse_val", (req, res) => {
  const id_boutique = req.body.id_boutique;
  db.query(
    "SELECT * FROM caisse where id_boutique = ?",
    id_boutique,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/create_depense", (req, res) => {
  const id_boutique = req.body.id_boutique;
  const montant = req.body.montant;
  const last_caisse = req.body.last_caisse;
  const end_caisse = req.body.end_caisse;
  const observation = req.body.observation;
  /* const date_actu = req.body.date_actu */
  db.query(
    "insert into depense (id_boutique, montant, last_caisse, end_caisse, observation) values (?,?,?,?,?)",
    [id_boutique, montant, last_caisse, end_caisse, observation],
    (err, result) => {
      if (!err) {
        db.query(
          "UPDATE caisse SET caisse = ? where id_boutique = ?",
          [end_caisse, id_boutique],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send("success");
            }
          }
        );
      } else {
        console.log(err);
      }
    }
  );
});

app.post("/create_decaissement", (req, res) => {
  const id_boutique = req.body.id_boutique;
  const numeros_compte = req.body.numeros_compte;
  const montant = req.body.montant;
  const last_caisse = req.body.last_caisse;
  const end_caisse = req.body.end_caisse;
  const observation = req.body.observation;
  /* const date_actu = req.body.date_actu */
  db.query(
    "insert into decaissement (id_boutique, numero_compte, montant, last_caisse, end_caisse, observation) values (?,?,?,?,?,?)",
    [
      id_boutique,
      numeros_compte,
      montant,
      last_caisse,
      end_caisse,
      observation,
    ],
    (err, result) => {
      if (!err) {
        db.query(
          "UPDATE caisse SET caisse = ? where id_boutique = ?",
          [end_caisse, id_boutique],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send("success");
            }
          }
        );
      } else {
        console.log(err);
      }
    }
  );
});
// recupe caisse value
app.post("/histo_depense", (req, res) => {
  const id_boutique = req.body.id_boutique;
  db.query(
    "SELECT * FROM depense where id_boutique = ?",
    id_boutique,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});
// recupe caisse value
app.post("/histo_decaissement", (req, res) => {
  const id_boutique = req.body.id_boutique;
  db.query(
    "SELECT * FROM decaissement where id_boutique = ?",
    id_boutique,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/update_caisse", (req, res) => {
  const id_boutique = req.body.id_boutique;
  const caisse = req.body.caisse;
  db.query(
    "UPDATE caisse SET caisse = ? where id_boutique = ?",
    [caisse, id_boutique],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("success");
      }
    }
  );
});
// {/* -Fichier server qui se charge de g??rer l'envoi des requ??tes de recherche depuis le programme ?? la base de donn??e cr????e
// */}
// const express = require('express');
// const app = express();
// const mysql = require('mysql');
// const cors = require('cors');

// require("dotenv").config();

// app.use(cors()); {/* -La mise en place de son environnement n??cessite l'installation de certains packets  */ }
// app.use(express.json());

// const db = mysql.createConnection({
//     user: 'root',
//     host: 'localhost',
//     password: '',
//     database: 'company',
// })
// db.connect(function (error) {
//     if(error){
//         console.log(error);
//         return;
//     } else {
//         console.log('Database is connected');
//     }
// });

// app.get('/', (req, res) => {
//             res.json({'message':'OK'});
// });
// app.get('/users', (req, res) => {
//     db.query('select * from user', (error, rows, fields) => {
//         if(!error) {
//             res.json(rows);
//         } else {
//             console.log(error);
//         }
//     });
// });

// //This function allows us concatenate 'id' to url => localhost:4000/id
// app.get('/users/:id', (req, res) => {
//     const { id } = req.params;
//     db.query('select * from user where id = ?', [id], (error, rows, fields) => {
//         if(!error) {
//             res.json(rows);
//         } else {
//             console.log(error);
//         }
//     })
// });

// app.post('/createusers', (req, res) => {
//     //const { id,  } = req.body;
//     const username = req.params.username
//     const name = req.params.name
//     const lastname = req.params.lastname
//     const mail = req.params.mail
//     const randomstr = req.params.randomstr
//     const hash = req.params.hash

//     console.log(username, name, lastname, mail, randomstr, hash);
//     db.query('insert into user(username, name, lastname, mail, randomstr, hash) values (?, ?, ?, ?, ?, ?)', [ username, name, lastname, mail, randomstr, hash], (error, rows, fields) => {
//         if(!error) {
//             res.json({Status : "User saved"})
//         } else {
//             console.log(error);
//         }
//     });
// })

// app.put('/updateusers/:id', (req, res) => {
//     const { id, username, name, lastname, mail, randomstr, hash } = req.body;
//     console.log(req.body);
//     db.query('update user set username = ?, name = ?, lastname = ?, mail = ?, randomstr = ?, hash = ? where id = ?;',
//     [username, name, lastname, mail, randomstr, hash, id], (error, rows, fields) => {
//         if(!error){
//             res.json({
//                 Status: 'User updated'
//             });
//         } else {
//             console.log(error);
//         }
//     });
// });

// app.delete('/deleteusers/:id', (req,res) => {
//     const { id } = req.params;
//     db.query('delete from user where id = ?', [id], (error, rows, fields) => {
//         if(!error){
//             res.json({
//                 Status: "User deleted"
//             });
//         } else {
//             res.json({
//                 Status: error
//             });
//         }
//     })
// });
// app.listen(8001, () => {
//     console.log('server lanc??')
// })
// // app.listen(process.env.PORT || 3001, () => {
// //     console.log('server lanc??')
// // })
