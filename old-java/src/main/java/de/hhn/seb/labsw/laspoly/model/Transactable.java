/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model;

public interface Transactable {
    public void addMoney(int var1);

    public boolean removeMoney(int var1);

    public int getMoneyAmount();

    default public boolean enoughMoney(int amount) {
        return this.getMoneyAmount() >= amount;
    }

    public String getName();
}

