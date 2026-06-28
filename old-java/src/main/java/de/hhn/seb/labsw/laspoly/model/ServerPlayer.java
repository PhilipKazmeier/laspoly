/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model;

import de.hhn.seb.labsw.laspoly.model.Transactable;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FigureSource;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class ServerPlayer
implements Transactable {
    private final User user;
    private final List<Integer> properties;
    private FigureSource figureSource;
    private int position;
    private int money;
    private int pingCounter = 0;
    private long joinedAt;
    private long lastPingAt;

    public ServerPlayer(User playerUser) {
        this.user = playerUser;
        this.position = 0;
        this.money = 1300;
        this.properties = new ArrayList<Integer>();
        long now = System.currentTimeMillis();
        this.joinedAt = now;
        this.lastPingAt = now;
    }

    public FigureSource getFigureSource() {
        return this.figureSource;
    }

    public void setFigureSource(FigureSource source) {
        this.figureSource = source;
    }

    public void addProperty(int propertyPosition) {
        this.properties.add(propertyPosition);
    }

    public Collection<Integer> getProperties() {
        return this.properties;
    }

    @Override
    public void addMoney(int amount) {
        this.money += amount;
    }

    @Override
    public boolean removeMoney(int amount) {
        if (!this.enoughMoney(amount)) {
            return false;
        }
        this.money -= amount;
        return true;
    }

    @Override
    public int getMoneyAmount() {
        return this.money;
    }

    @Override
    public String getName() {
        return this.user.getName();
    }

    public int getPosition() {
        return this.position;
    }

    public void setPosition(int pos) {
        this.position = pos;
    }

    public void incrementPingCounter() {
        ++this.pingCounter;
    }

    public void recordPing() {
        this.incrementPingCounter();
        this.lastPingAt = System.currentTimeMillis();
    }

    public int getPingCounter() {
        return this.pingCounter;
    }

    public long getJoinedAt() {
        return this.joinedAt;
    }

    public long getLastPingAt() {
        return this.lastPingAt;
    }

    void setLastPingAt(long lastPingAt) {
        this.lastPingAt = lastPingAt;
    }

    void setJoinedAt(long joinedAt) {
        this.joinedAt = joinedAt;
    }
}

