/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.priceinfo;

import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.model.priceinfo.PriceInfo;

public class StreetPriceInfo
extends PriceInfo {
    public static final int HOUSE_PRICE = 2;
    public static final int HOTEL_PRICE = 3;
    public static final int FACTORY_PRICE = 4;
    public static final int FACTORY_REVENUE = 5;
    public static final int BASE_RENT = 6;
    public static final int RENT_WITH_1_HOUSE = 7;
    public static final int RENT_WITH_2_HOUSES = 8;
    public static final int RENT_WITH_3_HOUSES = 9;
    public static final int RENT_WITH_4_HOUSES = 10;
    public static final int RENT_WITH_HOTEL = 11;

    public StreetPriceInfo(int ... rents) {
        super(rents);
        if (rents == null) {
            throw new InvalidParameterException("Rents can not be null.", "rents", null);
        }
        if (rents.length != 12) {
            throw new InvalidParameterException("Rents for streets must include 12 parameters.", "rents", rents.length);
        }
    }
}

