import fetch from "node-fetch";
import crypto from "crypto";

const tokenUrl = "https://api.rpx.co.id/api/token";
const ratesUrl = "https://api.rpx.co.id/api/v3/rates/";
const creds = Buffer.from("sembadarunrpx:#Sup3rS3cr3t").toString("base64");

async function run() {
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${creds}`
    },
    body: "grant_type=client_credential"
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token || tokenData.token || tokenData.data?.token;
  console.log("Token:", token ? "OK" : "Failed", tokenData);

  const payload = {
    origin: "55581", // Dummy origin
    destination: "55581", // Dummy dest
    weight: "1",
    accountnumber: "757720253",
    actual_discount: "",
    service: ""
  };

  const key = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAq/l7QSLbgbj6pMO8VgB1LqW5vy9yjilEsnorhCsTryqGTaJd
5tayRO5KLd1vhuImAfGXqRUR4Mwua5LS7GGre8We6i54AD4+91VIhDDKUsahKtDD
XH/md52/P9e4xzXDMvVYM50u8mY3iZZWflD4FO0XWSkbRYzdj2V6J9MkJn61yMxe
C0WvJrcj1ur8B1UhXru3nWNzxp5KzJBItEnGS2IlKKw4LgfqOJEg22ybOvXl4FA9
4Zy10EmK2mgUuNz/bbvIVOqm07kS+Obq62q0KwwIZK/rhd4Szq14kSCxgZiqRi+7
+H/ZHWF40P1N4I/ptKjmOQXOEC2rU87v89lyOwIDAQABAoIBAD8nYAb8iQWra4gE
RW6DvoTB4WN/Rh9EsnCkgsSHmTPzdtydqsQxxceghmcvcVxkQjbmhJ5YGXenI8jn
Y0PhXjsWyJQROopEUZU8oWPCExqwzNDPV17prTXyHSCR1M57RNK63IgfyfTEatLA
/cRncaMlqjRY7yXsZBTb3C8xz42+0a/A5lagCZ+o1/OdtRmg4oOjlC8LzqaB/BeL
Fa4egbGuE7PgAEB4Iur8Yt29S4tI5R+ZQ5dHndA++xRPXNMbgqVqsQPBLzO/gjXd
9bcATXQCsykek2h+Lr1rxsDPPAgsfdL5v8KxAIbqW9Txs0Naeqo9NQbUsBpsl9P+
GKPsqVkCgYEA5rUafsiF2TYgXyhIjSra873Mln84J3go4DOxIxFOgif6hMaTURfB
IDUs3qtuCiYO5ho6l3qxZsP618Z9t0rGvJfd6eUsA0ifgjoeJv2NbIIbPleTA0aV
hvPffnmeE+sJQUevKjlJu4kNKJC/6Wtv1K7WZp6dXVfx3AuJOUlXDecCgYEAvtQE
AoRHnS8j1warchHtnqmEY6U8zJMKAi3UdxI12JCK5QYqQsiJkxUm8thP55YCXRui
NHaxDJGG7E/vaoTmUqdDM+Za/f2A6ifYAzg0u3YYH3qJytMZXm2spkFw+HSXPSzt
L64T55u5J5fcjRyIYJ9pLdCo2Q54hdlcheqlpo0CgYAYyw+s3lncDQAPmeGqIhfj
p9sLtWJQg45JAeUgcqSwQiGfEUQVq+raTjyjNWMe/hYNznXLf6j+9ULI25D5GLUg
4WU81J8VP0G9GgfRguAm8BiDa5/l8zjwhtbW3bUKSPD2rgB6FiwBVmoumNe2+w/K
mHt8DcG1nVTlo+u8V1BeswKBgQCnPu4cvo59Rnlk1WWhXfEiI3PyWTmGGkClVEFn
8j/bBCOXQeX8DgH1NI6kO80cLS75J2TsEjJtz4WuywgMFVo/inStofCRtoIrtqvt
dm9Q9NmDjUQCzSzow7qTI7u9JYH/jcZ7CVhMnwCRoNkdm6oy9MOb8cpqIfKjbLNY
cySnaQKBgD13nOpjJm+jhS157td6O+zNrL5VAc73qW6eHS6TE6otQXzRnRdpSce/
CRfvP/kx5gD/JP/C8dGoKh3AmEvXI57xv2fGfDaOjuNzsltZklDuAfPq+rq3pqLq
aOUm74iVZ+FEbbKTJ53+gCoNoIsWOSiWQSvhKl77sRC+3zEGuMNt
-----END RSA PRIVATE KEY-----`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(JSON.stringify({ body: payload }));
  const signature = sign.sign(key, "base64");

  const ratesRes = await fetch(ratesUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      request: { body: payload },
      signature: signature
    })
  });

  const ratesData = await ratesRes.text();
  console.log("Rates Response:", ratesData);
}

run();
