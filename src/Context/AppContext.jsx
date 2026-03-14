import React, { createContext } from "react";

// 1. Create context
const AppContext = createContext();

// 2. Create provider
export const AppProvider = ({ children }) => {
  //   app related state and functions

  return (
    <AppContext.Provider value={{  }}>
      {children}
    </AppContext.Provider>
  );
};
