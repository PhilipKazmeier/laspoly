package de.hhn.seb.labsw.laspoly.network.client.listeners;

import de.hhn.seb.labsw.laspoly.network.client.ServerClient;
import org.glassfish.jersey.media.sse.EventListener;
import org.glassfish.jersey.media.sse.InboundEvent;

public class HeartbeatListener implements EventListener {
    private final ServerClient client;

    public HeartbeatListener(ServerClient serverClient) {
        this.client = serverClient;
    }

    @Override
    public void onEvent(InboundEvent inboundEvent) {
        this.client.notifySseEventReceived();
    }
}
