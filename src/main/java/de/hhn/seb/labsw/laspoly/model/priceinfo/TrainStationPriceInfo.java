/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.priceinfo;

import de.hhn.seb.labsw.laspoly.model.priceinfo.PriceInfo;

public class TrainStationPriceInfo
extends PriceInfo {
    public static final int TRAVEL_1_TS = 2;
    public static final int TRAVEL_2_TS = 3;
    public static final int TRAVEL_3_TS = 4;
    public static final int BASE_RENT = 5;
    public static final int RENT_WITH_2_STATIONS = 6;
    public static final int RENT_WITH_3_STATIONS = 7;
    public static final int RENT_WITH_4_STATIONS = 8;
    private static final int TRAIN_STATION_BASE_PRICE_VALUE = 200;
    private static final int TRAIN_STATION_MORTGAGE_VALUE = 100;
    private static final int TRAVEL_1_TS_VALUE = 75;
    private static final int TRAVEL_2_TS_VALUE = 150;
    private static final int TRAVEL_3_TS_VALUE = 225;
    private static final int BASE_RENT_VALUE = 50;
    private static final int RENT_WITH_2_STATIONS_VALUE = 100;
    private static final int RENT_WITH_3_STATIONS_VALUE = 200;
    private static final int RENT_WITH_4_STATIONS_VALUE = 400;

    public TrainStationPriceInfo() {
        super(200, 100, 75, 150, 225, 50, 100, 200, 400);
    }
}

