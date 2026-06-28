/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.debug;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.network.client.AdvancedClient;
import de.hhn.seb.labsw.laspoly.network.client.ServerClient;

public class DebugClient
extends ServerClient
implements AdvancedClient {
    public DebugClient(User clientUser) {
        super(clientUser);
    }

    @Override
    public void clearAll() {
        this.clearAllGames();
        this.clearAllUsers();
    }

    @Override
    public void clearAllUsers() {
        this.getTarget().path("users").path("clearAll").request().accept("application/json").get();
        this.register(this.getUser());
    }

    @Override
    public void clearAllGames() {
        this.getTarget().path("games").path("clearAll").request().accept("application/json").get();
    }
}

