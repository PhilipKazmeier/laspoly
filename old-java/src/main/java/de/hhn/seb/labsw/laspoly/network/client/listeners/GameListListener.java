/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.client.listeners;

import de.hhn.seb.labsw.laspoly.network.client.ServerClient;
import org.glassfish.jersey.media.sse.EventListener;
import org.glassfish.jersey.media.sse.InboundEvent;

public class GameListListener
implements EventListener {
    private final ServerClient client;

    public GameListListener(ServerClient serverClient) {
        this.client = serverClient;
    }

    @Override
    public void onEvent(InboundEvent inboundEvent) {
        if (this.client.updateIsRunning()) {
            this.client.notifySseEventReceived();
            this.client.updateGamesList(inboundEvent.readData());
            this.client.getController().onUpdate();
        }
    }
}

