/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.priceinfo;

import de.hhn.seb.labsw.laspoly.model.priceinfo.PriceInfo;

public class AttractionPriceInfo
extends PriceInfo {
    public static final int FACTOR_IF_1_ATTRACTION = 2;
    public static final int FACTOR_IF_2_ATTRACTIONS = 3;
    private static final int ATTRACTION_BASE_PRICE_VALUE = 150;
    private static final int ATTRACTION_MORTGAGE_VALUE = 75;
    private static final int FACTOR_IF_1_ATTRACTION_VALUE = 4;
    private static final int FACTOR_IF_2_ATTRACTIONS_VALUE = 10;

    public AttractionPriceInfo() {
        super(150, 75, 4, 10);
    }
}

