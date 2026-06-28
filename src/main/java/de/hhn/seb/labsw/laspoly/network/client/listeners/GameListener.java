/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.client.listeners;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import de.hhn.seb.labsw.laspoly.model.Game;
import de.hhn.seb.labsw.laspoly.network.client.ServerClient;
import de.hhn.seb.labsw.laspoly.utils.DateTimeConverter;
import java.lang.reflect.Type;
import org.glassfish.jersey.media.sse.EventListener;
import org.glassfish.jersey.media.sse.InboundEvent;
import org.joda.time.DateTime;

public class GameListener
implements EventListener {
    private final ServerClient client;
    private final Gson gson;

    public GameListener(ServerClient serverClient) {
        this.client = serverClient;
        this.gson = new GsonBuilder().registerTypeAdapter((Type)(DateTime.class), new DateTimeConverter()).create();
    }

    @Override
    public void onEvent(InboundEvent inboundEvent) {
        if (this.client.updateIsRunning()) {
            this.client.notifySseEventReceived();
            Game game1 = this.gson.fromJson(inboundEvent.readData(), Game.class);
            this.client.getController().getMainWindowController().setGame(game1);
            this.client.getController().onUpdate();
        }
    }
}

