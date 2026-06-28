/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.priceinfo;

public abstract class PriceInfo {
    public static final int BASE_PRICE = 0;
    public static final int MORTGAGE_VALUE = 1;
    private final int[] rentValues;

    public PriceInfo(int ... rents) {
        this.rentValues = rents;
    }

    public int getRent(int index) {
        return this.rentValues[index];
    }
}

