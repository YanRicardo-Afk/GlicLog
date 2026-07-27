const express = require("express");
const cors = require("cors");

require("dotenv").config();

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(
    cors()
);

app.use(
    express.json()
);

app.get(
    "/",
    (req, res) => {
        res.json({
            message: "API do GlicLog funcionando!"
        });
    }
);

app.use(
    "/api/auth",
    authRoutes
);
const path = require("path");
const glucoseRoutes = require("./routes/glucose.routes");

const PORT = process.env.PORT || 3000;

app.use(
    "/api/glucose",
    glucoseRoutes
);
app.use(
    express.static(
        path.join(
            __dirname,
            "../../frontend"
        )
    )
);
app.listen(
    PORT,
    () => {
        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );
    }
);