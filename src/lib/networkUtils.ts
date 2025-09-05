interface NetworkInfo {
  localIP: string;
  networkRange: string;
}

// Get user's public IP address using external service
export const getPublicIPAddress = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get public IP:', error);
    throw new Error('Unable to determine public IP address');
  }
};

// Get local IP address using WebRTC (prefers private LAN IP)
export const getLocalIPAddress = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const rtc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    rtc.createDataChannel('');

    let fallbackIP: string | null = null;

    rtc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candidate = event.candidate.candidate;
      const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (!ipMatch) return;
      const ip = ipMatch[1];
      if (ip.startsWith('127.')) return;

      if (isPrivateIP(ip)) {
        resolve(ip);
        rtc.close();
      } else if (!fallbackIP) {
        fallbackIP = ip; // keep first non-private in case we find no private
      }
    };

    rtc.createOffer()
      .then(offer => rtc.setLocalDescription(offer))
      .catch(reject);

    // Fallback timeout
    setTimeout(() => {
      if (fallbackIP) {
        resolve(fallbackIP);
        rtc.close();
      } else {
        reject(new Error('Could not determine local IP'));
      }
    }, 4000);
  });
};

// Determine if an IPv4 address is private (RFC1918)
export const isPrivateIP = (ip: string): boolean => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => isNaN(n))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
};

// Check if IP is on the "Secure Network" (10.70.0.0/19)
export const isOnSecureNetwork = (ip: string): boolean => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => isNaN(n))) return false;
  
  const [a, b, c] = parts;
  // "Secure Network" uses 10.70.0.0/19 range (10.70.0.1 to 10.70.31.254)
  return a === 10 && b === 70 && c >= 0 && c <= 31;
};

// Check if two IPs are on the same "Secure Network"
export const areOnSameNetwork = (ip1: string, ip2: string): boolean => {
  // Both IPs must be on the "Secure Network" for valid comparison
  return isOnSecureNetwork(ip1) && isOnSecureNetwork(ip2);
};

// Whitelisted public IP addresses
const WHITELISTED_IPS = ['47.247.94.99', '47.247.94.96', '117.198.141.197'];

// Check if public IP is whitelisted
export const isOnWhitelistedNetwork = async (): Promise<boolean> => {
  try {
    const publicIP = await getPublicIPAddress();
    return WHITELISTED_IPS.includes(publicIP);
  } catch (error) {
    console.error('Network validation error:', error);
    return false;
  }
};

// Get network information including public IP validation
export const getNetworkInfo = async (): Promise<NetworkInfo> => {
  try {
    const publicIP = await getPublicIPAddress();
    const isWhitelisted = WHITELISTED_IPS.includes(publicIP);
    const networkRange = isWhitelisted ? "Authorized Network" : "Unauthorized Network";
    return { localIP: publicIP, networkRange };
  } catch (error) {
    console.error('Network detection error:', error);
    throw new Error('Unable to detect network information');
  }
};

// Simple connectivity test to faculty's network
export const testNetworkConnectivity = async (facultyIP: string): Promise<boolean> => {
  try {
    const studentIP = await getLocalIPAddress();
    return areOnSameNetwork(studentIP, facultyIP);
  } catch (error) {
    console.error('Network connectivity test failed:', error);
    return false;
  }
};