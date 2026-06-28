/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.server.dao;

import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.network.server.dao.GameDao;
import de.hhn.seb.labsw.laspoly.network.server.dao.GameDaoCache;
import de.hhn.seb.labsw.laspoly.network.server.dao.UserDao;
import de.hhn.seb.labsw.laspoly.network.server.dao.UserDaoCache;

public final class DaoFactory {
    private DaoFactory() {
    }

    public static GameDao getGameDao(String type) {
        if (type.equalsIgnoreCase("cache")) {
            return GameDaoCache.instance;
        }
        throw new InvalidParameterException("The given type should be supported.", "type", type);
    }

    public static UserDao getUserDao(String type) {
        if (type.equalsIgnoreCase("cache")) {
            return UserDaoCache.instance;
        }
        throw new InvalidParameterException("The given type should be supported.", "type", type);
    }
}

