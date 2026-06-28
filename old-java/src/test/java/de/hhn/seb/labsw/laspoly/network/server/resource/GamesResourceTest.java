package de.hhn.seb.labsw.laspoly.network.server.resource;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.test.TestFixtures;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import java.lang.reflect.Type;
import javax.ws.rs.core.Response;
import org.joda.time.DateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GamesResourceTest {
    private final Gson gson = new GsonBuilder().registerTypeAdapter((Type) DateTime.class, new DateTimeConverter()).create();
    private GamesResource gamesResource;

    @BeforeEach
    void setUp() {
        this.gamesResource = new GamesResource();
        this.gamesResource.clearAll();
    }

    @Test
    void gameActionReturnsBadRequestForRejectedTransaction() {
        User host = TestFixtures.user("host", 42);
        Response addResponse = this.gamesResource.addGame("[" + this.gson.toJson("resilience-test") + "," + this.gson.toJson(host) + "]");
        Game game = this.gson.fromJson((String) addResponse.getEntity(), Game.class);
        TransactionAction debit = new TransactionAction(host, 5000, false, host);
        String actionPayload = "[" + this.gson.toJson(ActionType.TRANSACTION) + "," + this.gson.toJson(debit) + "]";
        String body = "[" + this.gson.toJson(game) + "," + actionPayload + "]";
        Response response = this.gamesResource.gameAction(body);
        assertEquals(Response.Status.BAD_REQUEST.getStatusCode(), response.getStatus());
    }

    @Test
    void gameActionReturnsOkForValidTransaction() {
        User host = TestFixtures.user("host2", 43);
        Response addResponse = this.gamesResource.addGame("[" + this.gson.toJson("valid-tx-test") + "," + this.gson.toJson(host) + "]");
        Game game = this.gson.fromJson((String) addResponse.getEntity(), Game.class);
        TransactionAction debit = new TransactionAction(host, 100, false, host);
        String actionPayload = "[" + this.gson.toJson(ActionType.TRANSACTION) + "," + this.gson.toJson(debit) + "]";
        String body = "[" + this.gson.toJson(game) + "," + actionPayload + "]";
        Response response = this.gamesResource.gameAction(body);
        assertEquals(Response.Status.OK.getStatusCode(), response.getStatus());
    }
}
